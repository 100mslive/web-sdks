import { getClosestLayer, layerToIntMapping } from './trackUtils';
import { HMSRemoteVideoTrack, HMSVideoTrack } from '.';
import { HMSPreferredSimulcastLayer } from '../../interfaces/simulcast-layers';
import { HMSIntersectionObserver } from '../../utils/intersection-observer';
import { HMSResizeObserver } from '../../utils/resize-observer';
import { isBrowser } from '../../utils/support';

/**
 * This class is to manager video elements for video tracks.
 * This will handle attaching/detaching when element is in view or out of view.
 * This will also handle selecting appropriate layer when element size changesx
 */
export class VideoElementManager {
  private resizeObserver?: typeof HMSResizeObserver;
  private intersectionObserver?: typeof HMSIntersectionObserver;
  private videoElements = new Set<HTMLVideoElement>();
  private entries = new Map<HTMLVideoElement, DOMRectReadOnly>();

  constructor(private track: HMSVideoTrack) {
    this.init();
  }

  updateSinks() {
    for (const videoElement of this.videoElements) {
      if (this.track.enabled) {
        this.track.addSink(videoElement);
      } else {
        this.track.removeSink(videoElement);
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
    this.videoElements.add(videoElement);
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
      this.track.setPreferredLayer(this.track.getPreferredLayer());
    }
  }

  removeVideoElement(videoElement: HTMLVideoElement): void {
    this.track.removeSink(videoElement);
    this.videoElements.delete(videoElement);
    this.resizeObserver?.unobserve(videoElement);
    this.intersectionObserver?.unobserve(videoElement);
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
      this.track.addSink(entry.target as HTMLVideoElement);
    } else {
      this.track.removeSink(entry.target as HTMLVideoElement);
    }
    this.entries.set(entry.target as HTMLVideoElement, entry.boundingClientRect);
    this.selectMaxLayer();
  };

  private handleResize = async (entry: ResizeObserverEntry) => {
    if (!this.track.enabled || !(this.track instanceof HMSRemoteVideoTrack)) {
      return;
    }
    this.entries.set(entry.target as HTMLVideoElement, entry.contentRect);
    this.selectMaxLayer();
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

  private async selectMaxLayer() {
    let maxLayer!: HMSPreferredSimulcastLayer;
    if (!(this.track instanceof HMSRemoteVideoTrack)) {
      return;
    }
    for (const entry of this.entries.values()) {
      const { width, height } = entry;
      const layer = getClosestLayer(this.track.getSimulcastDefinitions(), { width, height });
      if (!maxLayer) {
        maxLayer = layer;
      } else {
        maxLayer = layerToIntMapping[layer] > layerToIntMapping[maxLayer] ? layer : maxLayer;
      }
    }

    await this.track.setPreferredLayer(maxLayer);
  }

  cleanup = () => {
    this.resizeObserver = undefined;
    this.intersectionObserver = undefined;
  };
}
