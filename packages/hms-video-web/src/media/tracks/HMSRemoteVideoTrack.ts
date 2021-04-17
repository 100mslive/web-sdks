import HMSVideoTrack from './HMSVideoTrack';
import HMSRemoteStream from '../streams/HMSRemoteStream';

export default class HMSRemoteVideoTrack extends HMSVideoTrack {
  constructor(stream: HMSRemoteStream, track: MediaStreamTrack) {
    super(stream, track);
  }

  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) return;
    await super.setEnabled(value);
    await (this.stream as HMSRemoteStream).setVideo(value);
  }
}
