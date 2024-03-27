import { CaptionQueue } from './CaptionQueue';
import { CaptionData, Captions } from '../schema/caption-data';

export class CaptionManager {
  // peer_id: captionQueue
  private storage: { [key: string]: CaptionQueue } = {};
  private peerCapacity = 3;

  constructor(private putCaptionInStore: (captions: Captions[]) => void) {}

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
    this.updateCaptions();
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

  // store update
  updateCaptions() {
    const keys = Object.keys(this.storage);
    const data: Captions[] = keys.map((peerId: string) => {
      const word = this.storage[peerId].getCaption();
      return { peerId, caption: word };
    });
    this.putCaptionInStore(data);
  }

  private size(): number {
    return Object.getOwnPropertyNames(this.storage).length;
  }
}
