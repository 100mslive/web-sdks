import { isBrowser } from './support';

export interface HMSIntersectionObserverCallback {
  (entry: IntersectionObserverEntry): void;
}

class HMSIntersectionObserverWrapper {
  private intersectionObserver?: IntersectionObserver;
  private listeners = new Map<HTMLElement, HMSIntersectionObserverCallback>();
  constructor() {
    this.createObserver();
  }

  isSupported() {
    return isBrowser && typeof window.IntersectionObserver !== 'undefined';
  }

  observe = (element: HTMLElement, onIntersection: HMSIntersectionObserverCallback) => {
    this.createObserver();
    this.intersectionObserver?.observe(element);
    this.listeners.set(element, onIntersection);
  };

  unobserve = (element: HTMLElement) => {
    this.intersectionObserver?.unobserve(element);
    if (this.listeners.has(element)) {
      this.listeners.delete(element);
    }
  };

  private createObserver = () => {
    if (this.isSupported() && !this.intersectionObserver) {
      this.intersectionObserver = new IntersectionObserver(this.handleIntersection);
    }
  };

  private handleIntersection = (entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (this.listeners.has(entry.target as HTMLElement)) {
        this.listeners.get(entry.target as HTMLElement)?.(entry);
      }
    }
  };
}

export const HMSIntersectionObserver = new HMSIntersectionObserverWrapper();
