const valuesMap = new Map();

class LocalStorage {
  getItem(key: string) {
    const stringKey = String(key);
    if (valuesMap.has(key)) {
      return String(valuesMap.get(stringKey));
    }
    return null;
  }

  setItem(key: string, val: string) {
    valuesMap.set(String(key), String(val));
  }

  removeItem(key: string) {
    valuesMap.delete(key);
  }

  clear() {
    valuesMap.clear();
  }

  key(i: number) {
    if (arguments.length === 0) {
      throw new TypeError("Failed to execute 'key' on 'Storage': 1 argument required, but only 0 present."); // this is a TypeError implemented on Chrome, Firefox throws Not enough arguments to Storage.key.
    }
    const arr = Array.from(valuesMap.keys());
    return arr[i];
  }

  get length() {
    return valuesMap.size;
  }
}

if (!window.localStorage) {
  window.localStorage = new LocalStorage();
}

export {};
