import HMSAudioTrack from './HMSAudioTrack';
import HMSRemoteStream from '../streams/HMSRemoteStream';

export default class HMSRemoteAudioTrack extends HMSAudioTrack {
  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) return;
    await super.setEnabled(value);
    await (this.stream as HMSRemoteStream).setAudio(value);
  }
}
