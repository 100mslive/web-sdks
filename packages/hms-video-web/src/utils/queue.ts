export interface IQueue<T> {
  size(): number;
  enqueue(item: T): void;
  dequeue(): T | undefined;
}

export class Queue<T> implements IQueue<T> {
  protected storage: T[] = [];

  constructor(private capacity: number = Infinity) {}

  size() {
    return this.storage.length;
  }

  toList() {
    return this.storage.slice(0);
  }

  enqueue(item: T) {
    if (this.size() === this.capacity) {
      this.dequeue();
    }
    this.storage.push(item);
  }

  dequeue() {
    return this.storage.shift();
  }

  aggregate<R>(aggregationFn: (values: T[]) => R): R {
    return aggregationFn(this.storage);
  }
}
