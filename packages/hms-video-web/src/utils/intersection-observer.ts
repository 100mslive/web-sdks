export interface HMSIntersectionObserverCallback {
  (entry: IntersectionObserverEntry): void;
}

class HMSIntersectionObserverWrapper {
  private intersectionObserver: IntersectionObserver;
  private listeners = new Map<HTMLElement, Set<HMSIntersectionObserverCallback>>();
  constructor() {
    this.intersectionObserver = new IntersectionObserver(this.handleIntersection);
  }

  observe = (element: HTMLElement, onIntersection: HMSIntersectionObserverCallback) => {
    this.intersectionObserver.observe(element);
    let currentListeners = this.listeners.get(element);
    if (!currentListeners) {
      currentListeners = new Set();
    }
    currentListeners.add(onIntersection);
    this.listeners.set(element, currentListeners);
  };

  unobserve = (element: HTMLElement, onIntersection: HMSIntersectionObserverCallback) => {
    this.intersectionObserver.unobserve(element);
    if (this.listeners.has(element)) {
      this.listeners.get(element)?.delete(onIntersection);
    }
  };

  private handleIntersection = (entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (this.listeners.has(entry.target as HTMLElement)) {
        const callbacks = this.listeners.get(entry.target as HTMLElement);
        if (callbacks) {
          for (const callback of callbacks) {
            callback(entry);
          }
        }
      }
    }
  };
}

export const HMSIntersectionObserver = new HMSIntersectionObserverWrapper();
