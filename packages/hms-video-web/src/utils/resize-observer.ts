import { isBrowser } from './support';
import { debounce } from './timer-utils';

export interface HMSResizeObserverCallback {
  (entry: ResizeObserverEntry): void;
}

class HMSResizeObserverWrapper {
  private resizeObserver?: ResizeObserver;
  private listeners = new Map<HTMLElement, HMSResizeObserverCallback>();
  constructor() {
    this.createObserver();
  }

  isSupported() {
    return isBrowser && typeof window.ResizeObserver !== 'undefined';
  }

  observe = (
    element: HTMLElement,
    onResize: HMSResizeObserverCallback,
    options: ResizeObserverOptions = { box: 'border-box' },
  ) => {
    this.createObserver();
    this.resizeObserver?.observe(element, options);
    this.listeners.set(element, onResize);
  };

  unobserve = (element: HTMLElement) => {
    this.resizeObserver?.unobserve(element);
    if (this.listeners.has(element)) {
      this.listeners.delete(element);
    }
  };

  private createObserver = () => {
    if (this.isSupported() && !this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(debounce(this.handleResize, 300));
    }
  };

  private handleResize = (entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      if (this.listeners.has(entry.target as HTMLElement)) {
        this.listeners.get(entry.target as HTMLElement)?.(entry);
      }
    }
  };
}

export const HMSResizeObserver = new HMSResizeObserverWrapper();
