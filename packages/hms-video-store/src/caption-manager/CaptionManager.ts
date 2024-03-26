import { CaptionQueue } from './CaptionQueue';
import { CaptionData, Captions } from '../schema/caption-data';

export class CaptionManager {
  private storage: { [key: string]: CaptionQueue } = {};
  private peerCapacity = 3;

  add(data: CaptionData) {
    const captionData = {
      final: data.final,
      caption: data.caption,
    };
    if (data.peer_id in this.storage) {
      this.storage[data.peer_id].enqueue(captionData);
      return;
    }
    if (this.size() === this.peerCapacity) {
      this.delete();
    }
    this.storage[data.peer_id] = new CaptionQueue(3);
    this.storage[data.peer_id].enqueue(captionData);
  }
  // map ordered to delete first key..
  delete(): boolean {
    const key: string = Object.keys(this.storage).shift() || '';
    if (!key) {
      return false;
    }
    delete this.storage[key];
    return true;
  }

  getCaptions(): Captions[] {
    const keys = Object.keys(this.storage);
    const data = keys.map((peerId: string) => {
      const word = this.storage[peerId].getCaption();
      return { peerId, caption: word };
    });
    return data;
  }

  size(): number {
    return Object.getOwnPropertyNames(this.storage).length;
  }
}
