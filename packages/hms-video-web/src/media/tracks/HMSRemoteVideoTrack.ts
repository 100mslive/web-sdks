import { HMSVideoTrack } from './HMSVideoTrack';
import HMSRemoteStream from '../streams/HMSRemoteStream';
import { HMSSimulcastLayer } from '../settings';

export class HMSRemoteVideoTrack extends HMSVideoTrack {
  private _degraded = false;

  public get degraded() {
    return this._degraded;
  }

  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) return;
    await super.setEnabled(value);
  }

  preferLayer(layer: HMSSimulcastLayer) {
    (this.stream as HMSRemoteStream).setVideo(layer);
  }

  getSimulcastLayer() {
    return (this.stream as HMSRemoteStream).getSimulcastLayer();
  }

  addSink(videoElement: HTMLVideoElement) {
    super.addSink(videoElement);
    this.updateLayer();
  }

  removeSink(videoElement: HTMLVideoElement) {
    super.removeSink(videoElement);
    this.updateLayer();
  }

  /** @internal */
  setDegraded(value: boolean) {
    this._degraded = value;
    this.updateLayer();
  }

  private updateLayer() {
    let newLayer = this.hasSinks() ? HMSSimulcastLayer.HIGH : HMSSimulcastLayer.NONE;
    if (this.degraded) newLayer = HMSSimulcastLayer.NONE;
    (this.stream as HMSRemoteStream).setVideo(newLayer);
  }
}
