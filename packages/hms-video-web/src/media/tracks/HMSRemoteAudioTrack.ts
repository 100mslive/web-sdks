import { HMSAudioTrack } from './HMSAudioTrack';
import HMSRemoteStream from '../streams/HMSRemoteStream';

export class HMSRemoteAudioTrack extends HMSAudioTrack {
  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) return;
    await super.setEnabled(value);
    (this.stream as HMSRemoteStream).setAudio(value);
  }
}
