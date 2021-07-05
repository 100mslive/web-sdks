export class LocalStorage<T> {
  private storage = localStorage;

  constructor(public readonly key: string) {}

  get(): T | undefined {
    const stringItem = this.storage.getItem(this.key);
    if (!stringItem) {
      return;
    }
    const item = JSON.parse(stringItem) as T;
    return item;
  }

  set(value: T) {
    const stringValue = JSON.stringify(value);
    this.storage.setItem(this.key, stringValue);
  }

  clear() {
    this.storage.removeItem(this.key);
  }
}
