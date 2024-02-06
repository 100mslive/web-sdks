import HMSLogger from './logger';
import { isBrowser } from './support';
import { ErrorFactory } from '../error/ErrorFactory';

class LocalStorage {
  valuesMap = new Map();
  getItem(key: string) {
    if (this.valuesMap.has(key)) {
      return String(this.valuesMap.get(key));
    }
    return null;
  }

  setItem(key: string, val: string) {
    this.valuesMap.set(key, val);
  }

  removeItem(key: string) {
    this.valuesMap.delete(key);
  }

  clear() {
    this.valuesMap.clear();
  }

  key(i: number) {
    if (arguments.length === 0) {
      throw new TypeError("Failed to execute 'key' on 'Storage': 1 argument required, but only 0 present."); // this is a TypeError implemented on Chrome, Firefox throws Not enough arguments to Storage.key.
    }
    const arr = Array.from(this.valuesMap.keys());
    return arr[i];
  }

  get length() {
    return this.valuesMap.size;
  }
}

export const initializeLocalstoragePolyfill = () => {
  try {
    if (isBrowser && !localStorage) {
      window.localStorage = new LocalStorage();
    }
  } catch (e) {
    HMSLogger.e('Error initialising localStorage', ErrorFactory.GenericErrors.LocalStorageAccessDenied());
  }
};
