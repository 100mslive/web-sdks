import { v4 as uuid } from 'uuid';
import { getClosestLayer, layerToIntMapping } from './trackUtils';
import { HMSPreferredSimulcastLayer } from '../../interfaces/simulcast-layers';
import { HMSLocalVideoTrack, HMSRemoteVideoTrack } from '../../internal';
import { HMSIntersectionObserver } from '../../utils/intersection-observer';
import HMSLogger from '../../utils/logger';
import { HMSResizeObserver } from '../../utils/resize-observer';
import { isBrowser } from '../../utils/support';

/**
 * This class is to manager video elements for video tracks.
 * This will handle attaching/detaching when element is in view or out of view.
 * This will also handle selecting appropriate layer when element size changesx
 */
export class VideoElementManager {
  private readonly TAG = '[VideoElementManager]';
  private resizeObserver?: typeof HMSResizeObserver;
  private intersectionObserver?: typeof HMSIntersectionObserver;
  private videoElements = new Set<HTMLVideoElement>();
  private entries = new WeakMap<HTMLVideoElement, DOMRectReadOnly>();
  private id: string;
  /** Which intersection entry an element is currently acting on - see handleIntersection. */
  private intersectionSeq = new WeakMap<HTMLVideoElement, number>();
  private seq = 0;

  constructor(private track: HMSLocalVideoTrack | HMSRemoteVideoTrack) {
    this.init();
    this.id = uuid();
  }

  /**
   * addSink/removeSink reject when the layer request fails, and every call below discards the
   * promise - updateSinks and removeVideoElement are sync, addVideoElement is discarded by
   * HMSVideoTrack.attach, and the observers discard the handlers. Swallow here rather than inside
   * the track, so attachVideo/detachVideo and setPreferredLayer keep reporting failures to the app.
   * Logged at error because a warn is dropped once an app calls setLogLevel(ERROR).
   */
  private logIfRejected(result: void | Promise<void>, action: string) {
    Promise.resolve(result).catch(error => HMSLogger.e(this.TAG, `${action} failed`, `${this.track}`, error));
  }

  updateSinks(requestLayer = false) {
    for (const videoElement of this.videoElements) {
      if (this.track.enabled) {
        this.logIfRejected(this.track.addSink(videoElement, requestLayer), 'addSink');
      } else {
        this.logIfRejected(this.track.removeSink(videoElement, requestLayer), 'removeSink');
      }
    }
  }

  // eslint-disable-next-line complexity
  async addVideoElement(videoElement: HTMLVideoElement) {
    if (this.videoElements.has(videoElement)) {
      return;
    }
    // Call init again, to initialize again if for some reason it failed in constructor
    // it will be a no-op if initialize already
    this.init();
    HMSLogger.d(this.TAG, `Adding video element for ${this.track}`, this.id);
    this.videoElements.add(videoElement);
    if (this.videoElements.size >= 10) {
      HMSLogger.w(
        this.TAG,
        `${this.track}`,
        `the track is added to ${this.videoElements.size} video elements, while this may be intentional, it's likely that there is a bug leading to unnecessary creation of video elements in the UI`,
      );
    }

    if (this.intersectionObserver?.isSupported()) {
      this.intersectionObserver.observe(videoElement, this.handleIntersection);
    } else if (isBrowser) {
      if (this.isElementInViewport(videoElement)) {
        this.logIfRejected(this.track.addSink(videoElement), 'addSink');
      } else {
        this.logIfRejected(this.track.removeSink(videoElement), 'removeSink');
      }
    }
    if (this.resizeObserver) {
      this.resizeObserver.observe(videoElement, this.handleResize);
    } else if (this.track instanceof HMSRemoteVideoTrack) {
      this.logIfRejected(this.track.setPreferredLayer(this.track.getPreferredLayer()), 'setPreferredLayer');
    }
  }

  removeVideoElement(videoElement: HTMLVideoElement): void {
    this.videoElements.delete(videoElement);
    this.entries.delete(videoElement);
    this.intersectionSeq.delete(videoElement);
    this.resizeObserver?.unobserve(videoElement);
    this.intersectionObserver?.unobserve(videoElement);
    /**
     * removeSink first, and not behind an await: it nulls srcObject synchronously, and
     * detachVideo/attachVideo run back to back when a tile swaps tracks - a deferred detach lands
     * after the new stream is attached and nulls it.
     *
     * Then recompute. The layer asked for is the max across live tiles, so the tile being removed
     * may be the one holding it up, and removeSink's own updateLayer asks for the unchanged
     * `preferredLayer` - which shouldSendVideoLayer sees as already current and skips, leaving the
     * SFU streaming for a tile that is gone.
     */
    this.logIfRejected(
      Promise.resolve(this.track.removeSink(videoElement)).then(() => this.selectMaxLayer()),
      'removeSink',
    );
    HMSLogger.d(this.TAG, `Removing video element for ${this.track}`);
  }

  getVideoElements(): HTMLVideoElement[] {
    return Array.from(this.videoElements);
  }

  private init() {
    if (isBrowser) {
      this.resizeObserver = HMSResizeObserver;
      this.intersectionObserver = HMSIntersectionObserver;
    }
  }

  /**
   * The observer never awaits this, so scrolling a tile in and straight back out runs both entries
   * at once. The add suspends on selectMaxLayer before it attaches a sink, which leaves the remove
   * nothing to undo - it sees no sink and a layer already on none, so it sends nothing, and then
   * the stale add resumes and asks for high, leaving the SFU streaming a tile no element renders.
   * Stamp each entry and drop the add if a newer entry for that element arrived while it was
   * suspended, so the last thing the user did is what decides the sink.
   */
  private handleIntersection = async (entry: IntersectionObserverEntry) => {
    // cleanup() nulls the observer fields; treat that as the destroyed signal.
    if (!this.intersectionObserver) {
      return;
    }
    const target = entry.target as HTMLVideoElement;
    const seq = ++this.seq;
    this.intersectionSeq.set(target, seq);
    const isVisibile = getComputedStyle(entry.target).visibility === 'visible';
    // .contains check is needed for pip component as the video tiles are not mounted to dom element
    if (this.track.enabled && ((entry.isIntersecting && isVisibile) || !document.contains(entry.target))) {
      await this.addSinkForEntry(target, entry.boundingClientRect, seq);
    } else {
      HMSLogger.d(this.TAG, 'remove sink intersection', `${this.track}`, this.id);
      this.logIfRejected(this.track.removeSink(target), 'removeSink');
    }
  };

  private async addSinkForEntry(target: HTMLVideoElement, rect: DOMRectReadOnly, seq: number) {
    HMSLogger.d(this.TAG, 'add sink intersection', `${this.track}`, this.id);
    this.entries.set(target, rect);
    await this.selectMaxLayer();
    if (!this.shouldStillAddSink(target, seq)) {
      HMSLogger.d(this.TAG, 'add sink superseded', `${this.track}`, this.id);
      return;
    }
    this.logIfRejected(this.track.addSink(target), 'addSink');
  }

  /**
   * A newer intersection entry is not the only thing that can make a suspended add stale - the
   * element can be detached (React unmounting the tile) or the whole manager cleaned up while it
   * waits on its layer request. Neither touches the entry stamp, so both are checked here too;
   * without it the add re-attaches srcObject to an element nobody renders and asks the SFU to keep
   * streaming to it.
   */
  private shouldStillAddSink(target: HTMLVideoElement, seq: number) {
    return this.videoElements.has(target) && this.intersectionSeq.get(target) === seq;
  }

  private handleResize = async (entry: ResizeObserverEntry) => {
    if (!this.resizeObserver) {
      return;
    }
    if (!this.track.enabled || !(this.track instanceof HMSRemoteVideoTrack)) {
      return;
    }
    this.entries.set(entry.target as HTMLVideoElement, entry.contentRect);
    await this.selectMaxLayer();
  };

  /**
   *  Taken from
   *  https://stackoverflow.com/a/125106/4321808
   */
  // eslint-disable-next-line complexity
  private isElementInViewport(el: HTMLElement) {
    let top = el.offsetTop;
    let left = el.offsetLeft;
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    const { hidden } = el;
    const { opacity, display } = getComputedStyle(el);

    while (el.offsetParent) {
      el = el.offsetParent as HTMLElement;
      top += el.offsetTop;
      left += el.offsetLeft;
    }

    return (
      top < window.pageYOffset + window.innerHeight &&
      left < window.pageXOffset + window.innerWidth &&
      top + height > window.pageYOffset &&
      left + width > window.pageXOffset &&
      !hidden &&
      (opacity !== '' ? parseFloat(opacity) > 0 : true) &&
      display !== 'none'
    );
  }

  // eslint-disable-next-line complexity
  private async selectMaxLayer() {
    // No elements left means no layer to pick, not "pick none" - removeSink's own updateLayer is
    // what sends NONE once hasSinks() goes false, so leaving preferredLayer alone here is correct
    // and the removal path depends on it.
    if (!(this.track instanceof HMSRemoteVideoTrack) || this.videoElements.size === 0) {
      return;
    }
    let maxLayer!: HMSPreferredSimulcastLayer;
    for (const element of this.videoElements) {
      const entry = this.entries.get(element);
      if (!entry) {
        continue;
      }
      const { width, height } = entry;
      if (width === 0 || height === 0) {
        continue;
      }
      const layer = getClosestLayer(this.track.getSimulcastDefinitions(), { width, height });
      if (!maxLayer) {
        maxLayer = layer;
      } else {
        maxLayer = layerToIntMapping[layer] > layerToIntMapping[maxLayer] ? layer : maxLayer;
      }
    }
    if (maxLayer) {
      HMSLogger.d(this.TAG, `selecting max layer ${maxLayer} for the track`, `${this.track}`);
      /**
       * Picking a layer is an optimisation over rendering the track, and the only callers are the
       * resize and intersection handlers, which observers invoke without awaiting. Letting this
       * reject would abort the sink attach and surface as an unhandled rejection.
       */
      try {
        await this.track.setPreferredLayer(maxLayer);
      } catch (error) {
        // error, not warn: a warn is dropped once an app calls setLogLevel(ERROR)
        HMSLogger.e(this.TAG, `failed to select layer ${maxLayer}`, `${this.track}`, error);
      }
    }
  }

  cleanup = () => {
    this.videoElements.forEach(videoElement => {
      videoElement.srcObject = null;
      this.resizeObserver?.unobserve(videoElement);
      this.intersectionObserver?.unobserve(videoElement);
    });
    this.videoElements.clear();
    this.resizeObserver = undefined;
    this.intersectionObserver = undefined;
  };
}
