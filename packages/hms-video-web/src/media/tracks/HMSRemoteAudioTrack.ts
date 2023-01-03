import { HMSAudioTrack } from './HMSAudioTrack';

export class HMSRemoteAudioTrack extends HMSAudioTrack {
  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) {
      return;
    }
    await super.setEnabled(value);
    await this.subscribeToAudio(value);
  }
}
