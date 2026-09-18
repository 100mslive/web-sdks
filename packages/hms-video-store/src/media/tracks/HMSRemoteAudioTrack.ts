import { HMSAudioTrack } from './HMSAudioTrack';

export class HMSRemoteAudioTrack extends HMSAudioTrack {
  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) {
      return;
    }
    await super.setEnabled(value);
    // the peer unmuting must not resubscribe audio the user silenced with setVolume(0)
    await this.subscribeToAudio(value && !this.isSilenced());
  }
}
