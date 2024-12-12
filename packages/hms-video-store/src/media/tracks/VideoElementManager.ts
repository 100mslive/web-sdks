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

  constructor(private track: HMSLocalVideoTrack | HMSRemoteVideoTrack) {
    this.init();
    this.id = uuid();
  }

  updateSinks(requestLayer = false) {
    for (const videoElement of this.videoElements) {
      if (this.track.enabled) {
        this.track.addSink(videoElement, requestLayer);
      } else {
        this.track.removeSink(videoElement, requestLayer);
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
        this.track.addSink(videoElement);
      } else {
        this.track.removeSink(videoElement);
      }
    }
    if (this.resizeObserver) {
      this.resizeObserver.observe(videoElement, this.handleResize);
    } else if (this.track instanceof HMSRemoteVideoTrack) {
      await this.track.setPreferredLayer(this.track.getPreferredLayer());
    }
  }

  removeVideoElement(videoElement: HTMLVideoElement): void {
    this.track.removeSink(videoElement);
    this.videoElements.delete(videoElement);
    this.entries.delete(videoElement);
    this.resizeObserver?.unobserve(videoElement);
    this.intersectionObserver?.unobserve(videoElement);
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

  private handleIntersection = async (entry: IntersectionObserverEntry) => {
    const isVisibile = getComputedStyle(entry.target).visibility === 'visible';
    // .contains check is needed for pip component as the video tiles are not mounted to dom element
    if (this.track.enabled && ((entry.isIntersecting && isVisibile) || !document.contains(entry.target))) {
      HMSLogger.d(this.TAG, 'add sink intersection', `${this.track}`, this.id);
      this.entries.set(entry.target as HTMLVideoElement, entry.boundingClientRect);
      await this.selectMaxLayer();
      await this.track.addSink(entry.target as HTMLVideoElement);
    } else {
      HMSLogger.d(this.TAG, 'remove sink intersection', `${this.track}`, this.id);
      await this.track.removeSink(entry.target as HTMLVideoElement);
    }
  };

  private handleResize = async (entry: ResizeObserverEntry) => {
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
      await this.track.setPreferredLayer(maxLayer);
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
