import HMSVideoTrack from './HMSVideoTrack';
import HMSRemoteStream from '../streams/HMSRemoteStream';

export default class HMSRemoteVideoTrack extends HMSVideoTrack {
  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) return;
    await super.setEnabled(value);
    await (this.stream as HMSRemoteStream).setVideo(value);
  }
}
