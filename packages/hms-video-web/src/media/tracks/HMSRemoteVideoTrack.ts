import HMSVideoTrack from './HMSVideoTrack';
import HMSRemoteStream from '../streams/HMSRemoteStream';
import { HMSSimulcastLayer } from '../settings';

export default class HMSRemoteVideoTrack extends HMSVideoTrack {
  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) return;
    await super.setEnabled(value);
  }

  preferLayer(layer: HMSSimulcastLayer) {
    (this.stream as HMSRemoteStream).setVideo(layer);
  }

  addSink(videoElement: HTMLVideoElement) {
    this.preferLayer(HMSSimulcastLayer.HIGH);
    super.addSink(videoElement);
  }

  removeSink(videoElement: HTMLVideoElement) {
    this.preferLayer(HMSSimulcastLayer.NONE);
    super.removeSink(videoElement);
  }
}
