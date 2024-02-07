import { HMSMediaStreamPlugin } from '@100mslive/hms-video-store';

export class KrispPlugin implements HMSMediaStreamPlugin {
  private audioContext: AudioContext;
  constructor() {
    this.audioContext = new AudioContext();
  }
  getName() {
    return 'HMSKrispPlugin';
  }
  apply(stream: MediaStream) {
    this.audioContext.createMediaStreamSource(stream);
    const destination = this.audioContext.createMediaStreamDestination();
    return destination.stream;
  }
  stop() {}
}
