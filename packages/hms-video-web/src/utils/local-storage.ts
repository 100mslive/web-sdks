import { initializeLocalstoragePolyfill } from './local-storage-polyfill';
import HMSLogger from './logger';
import { isBrowser } from './support';
import { ErrorFactory } from '../error/ErrorFactory';

export class LocalStorage<T> {
  private storage: Storage | null = null;

  constructor(public readonly key: string) {}

  /**
   * localstorage is not available in SSR, so get it only at time of use
   */
  getStorage() {
    try {
      if (isBrowser && !this.storage) {
        initializeLocalstoragePolyfill();
        this.storage = window.localStorage;
      }
      return this.storage;
    } catch (e) {
      HMSLogger.e('Error initialising localStorage', ErrorFactory.GenericErrors.LocalStorageAccessDenied());
      return null;
    }
  }

  get(): T | undefined {
    const stringItem = this.getStorage()?.getItem(this.key);
    if (!stringItem) {
      return;
    }
    const item = JSON.parse(stringItem) as T;
    return item;
  }

  set(value: T) {
    const stringValue = JSON.stringify(value);
    this.getStorage()?.setItem(this.key, stringValue);
  }

  clear() {
    this.getStorage()?.removeItem(this.key);
  }
}
