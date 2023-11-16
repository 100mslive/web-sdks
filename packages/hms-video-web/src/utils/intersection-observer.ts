import HMSLogger from './logger';
import { isBrowser } from './support';

export interface HMSIntersectionObserverCallback {
  (entry: IntersectionObserverEntry): void;
}

/**
 * This is a wrapper around IntersectionObserver which will call the callback passed
 * for an element while observing, only when that element is intersecting
 */
export class HMSIntersectionObserverWrapper {
  private intersectionObserver?: IntersectionObserver;
  private readonly TAG = '[HMSIntersectionObserverWrapper]';
  private listeners = new WeakMap<HTMLElement, HMSIntersectionObserverCallback>();
  constructor() {
    this.createObserver();
  }

  isSupported() {
    const isSupported = isBrowser && typeof window.IntersectionObserver !== 'undefined';
    if (!isSupported) {
      HMSLogger.w(this.TAG, 'IntersectionObserver is not supported, fallback will be used instead');
    }
    return isSupported;
  }

  observe = (element: HTMLElement, onIntersection: HMSIntersectionObserverCallback) => {
    this.createObserver();
    // unobserve before observing the element
    this.unobserve(element);
    this.intersectionObserver?.observe(element);
    this.listeners.set(element, onIntersection);
  };

  unobserve = (element: HTMLElement) => {
    this.intersectionObserver?.unobserve(element);
    this.listeners.delete(element);
  };

  private createObserver = () => {
    if (this.isSupported() && !this.intersectionObserver) {
      this.intersectionObserver = new IntersectionObserver(this.handleIntersection);
    }
  };

  private handleIntersection = (entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      this.listeners.get(entry.target as HTMLElement)?.(entry);
    }
  };
}

export const HMSIntersectionObserver = new HMSIntersectionObserverWrapper();
