export interface IQueue<T> {
  size(): number;
  enqueue(item: T): void;
  dequeue(): T | undefined;
}

export class Queue<T> implements IQueue<T> {
  protected storage: T[] = [];

  constructor(protected capacity: number = Infinity) {}

  size() {
    return this.storage.length;
  }

  enqueue(item: T) {
    if (this.size() === this.capacity) {
      throw Error('Queue has reached max capacity, cannot add more items');
    }
    this.storage.push(item);
  }

  dequeue() {
    return this.storage.shift();
  }
}

export class FixedSizeQueue<T extends number> extends Queue<T> {
  enqueue(item: T) {
    if (this.size() === this.capacity) {
      this.dequeue();
    }
    this.storage.push(item);
  }

  dequeue() {
    return this.storage.shift();
  }

  getMax() {
    return Math.max(...this.storage);
  }
}
