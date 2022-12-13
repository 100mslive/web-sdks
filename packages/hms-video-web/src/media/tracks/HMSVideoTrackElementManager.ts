import { HMSVideoTrack } from './HMSVideoTrack';
import { getClosestLayer, layerToIntMapping } from './trackUtils';
import { HMSPreferredSimulcastLayer } from '../../interfaces/simulcast-layers';
import { isBrowser } from '../../utils/support';
import { debounce } from '../../utils/timer-utils';

export class HMSVideoTrackElementManager {
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private videoElements = new Set<HTMLVideoElement>();

  constructor(private track: HMSVideoTrack) {
    if (isBrowser) {
      if (typeof window.ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(debounce(this.handleResize, 300));
      }
      if (typeof window.IntersectionObserver !== 'undefined') {
        this.intersectionObserver = new IntersectionObserver(debounce(this.handleIntersection, 300));
      }
    }
  }

  async addVideoElement(videoElement: HTMLVideoElement) {
    if (this.videoElements.has(videoElement)) {
      return;
    }
    this.videoElements.add(videoElement);
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(videoElement);
    } else {
      if (this.isElementInViewport(videoElement)) {
        this.track.addSink(videoElement);
      } else {
        this.track.removeSink(videoElement);
      }
    }
    if (this.resizeObserver) {
      this.resizeObserver.observe(videoElement, { box: 'border-box' });
      // @ts-ignore
    } else if (this.track.setPreferredLayer) {
      // @ts-ignore
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

  private handleIntersection = async (entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      const isVisibile = getComputedStyle(entry.target).visibility === 'visible';
      if (entry.isIntersecting && isVisibile) {
        this.track.addSink(entry.target as HTMLVideoElement);
      } else {
        this.track.removeSink(entry.target as HTMLVideoElement);
      }
    }
    this.selectMaxLayer(entries.map(entry => entry.boundingClientRect));
  };

  private handleResize = async (entries: ResizeObserverEntry[]) => {
    this.selectMaxLayer(entries.map(entry => entry.contentRect));
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

  private async selectMaxLayer(dimensions: Array<{ width: number; height: number }>) {
    let maxLayer!: HMSPreferredSimulcastLayer;
    // @ts-ignore
    if (!this.track.setPreferredLayer) {
      return;
    }
    for (const entry of dimensions) {
      const { width, height } = entry;
      //@ts-ignore
      const layer = getClosestLayer(this.track.getSimulcastDefinitions(), { width, height });
      if (!maxLayer) {
        maxLayer = layer;
      } else {
        maxLayer = layerToIntMapping[layer] > layerToIntMapping[maxLayer] ? layer : maxLayer;
      }
    }
    // @ts-ignore
    await this.track.setPreferredLayer(maxLayer);
  }
}
