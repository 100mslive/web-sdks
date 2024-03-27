export interface ICaptionQueue {
  enqueue(item: QueueData): void;
  dequeue(): QueueData | undefined;
  getCaption(): string | undefined;
  size(): number;
}
export interface QueueData {
  final: boolean;
  caption: string;
}
export class CaptionQueue implements ICaptionQueue {
  private storage: QueueData[] = [];

  constructor(private capacity: number = 6) {}

  enqueue(item: QueueData): void {
    if (this.size() === this.capacity && this.storage[this.size() - 1].final) {
      this.dequeue();
    }
    if (this.size() === 0 || item.final) {
      this.storage.push(item);
      return;
    }
    this.storage[this.size() - 1] = item;
  }
  dequeue(): QueueData | undefined {
    if (this.size() <= 0) {
      return undefined;
    }
    return this.storage.shift();
  }
  getCaption(): string {
    let script = '';
    this.storage.forEach((value: QueueData) => (script += `${value.caption} `));
    return script;
  }
  size(): number {
    return this.storage.length;
  }
}
