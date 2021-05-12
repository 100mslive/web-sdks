import HMSVideoTrack from './HMSVideoTrack';
import HMSRemoteStream from '../streams/HMSRemoteStream';
import { HMSSimulcastLayer } from '../settings';

export default class HMSRemoteVideoTrack extends HMSVideoTrack {
  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) return;
    await super.setEnabled(value);
    const layer = value ? HMSSimulcastLayer.HIGH : HMSSimulcastLayer.NONE;
    await this.preferLayer(layer);
  }

  async preferLayer(layer: HMSSimulcastLayer) {
    await (this.stream as HMSRemoteStream).setVideo(layer);
  }

  async addSink(videoElement: HTMLVideoElement) {
    await this.preferLayer(HMSSimulcastLayer.HIGH);
    super.addSink(videoElement);
  }

  async removeSink(videoElement: HTMLVideoElement) {
    await this.preferLayer(HMSSimulcastLayer.NONE);
    super.removeSink(videoElement);
  }
}
