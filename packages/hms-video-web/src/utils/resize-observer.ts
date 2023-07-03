import HMSLogger from './logger';
import { isBrowser } from './support';
import { debounce } from './timer-utils';

export interface HMSResizeObserverCallback {
  (entry: ResizeObserverEntry): void;
}

/**
 * This is a wrapper around ResizeObserver which will call the callback passed
 * for an element while observing, only when that element is intersecting
 */
export class HMSResizeObserverWrapper {
  private resizeObserver?: ResizeObserver;
  private readonly TAG = '[HMSResizeObserverWrapper]';
  private listeners = new WeakMap<HTMLElement, HMSResizeObserverCallback>();
  constructor() {
    this.createObserver();
  }

  isSupported() {
    const isSupported = isBrowser && typeof window.ResizeObserver !== 'undefined';
    if (!isSupported) {
      HMSLogger.w(this.TAG, 'Resize Observer is not supported');
    }
    return isSupported;
  }

  observe = (
    element: HTMLElement,
    onResize: HMSResizeObserverCallback,
    options: ResizeObserverOptions = { box: 'border-box' },
  ) => {
    this.createObserver();
    // unobserve before observing the element
    this.unobserve(element);
    this.resizeObserver?.observe(element, options);
    this.listeners.set(element, onResize);
  };

  unobserve = (element: HTMLElement) => {
    this.resizeObserver?.unobserve(element);
    this.listeners.delete(element);
  };

  private createObserver = () => {
    if (this.isSupported() && !this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(debounce(this.handleResize, 300));
    }
  };

  private handleResize = (entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      this.listeners.get(entry.target as HTMLElement)?.(entry);
    }
  };
}

export const HMSResizeObserver = new HMSResizeObserverWrapper();
