import { HMSVideoTrack } from './HMSVideoTrack';
import HMSRemoteStream from '../streams/HMSRemoteStream';
import { HMSSimulcastLayer, SimulcastLayerDefinition } from '../../interfaces/simulcast-layers';

export class HMSRemoteVideoTrack extends HMSVideoTrack {
  private _degraded = false;
  private _degradedAt: Date | null = null;
  private _layerDefinitions: SimulcastLayerDefinition[] = [];

  public get degraded() {
    return this._degraded;
  }

  public get degradedAt() {
    return this._degradedAt;
  }

  async setEnabled(value: boolean): Promise<void> {
    if (value === this.enabled) {
      return;
    }

    // If remote track is muted when degraded, reset degraded state
    if (this._degraded && !value) {
      this._degraded = false;
    }

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

  /**
   * Method to get available simulcast definitions for the track
   * @returns {SimulcastLayerDefinition[]}
   */
  getSimulcastDefinitions() {
    // send a clone to store as it will freeze the object from further updates
    return [...this._layerDefinitions];
  }

  /** @internal */
  setSimulcastDefinitons(definitions: SimulcastLayerDefinition[]) {
    this._layerDefinitions = definitions;
  }

  /** @internal */
  setDegraded(value: boolean) {
    this._degraded = value;
    if (value) {
      this._degradedAt = new Date();
    }

    if (this.stream instanceof HMSRemoteStream && this.stream.isServerHandlingDegradation()) {
      // No need to degrade track, as server has done it already
      const layer = value ? HMSSimulcastLayer.NONE : HMSSimulcastLayer.HIGH;
      (this.stream as HMSRemoteStream).setVideo(layer, false);
      return;
    }

    this.updateLayer();
  }

  private updateLayer() {
    let newLayer = this.hasSinks() ? HMSSimulcastLayer.HIGH : HMSSimulcastLayer.NONE;
    if (this.degraded) {
      if (this.stream instanceof HMSRemoteStream && this.stream.isServerHandlingDegradation()) {
        return;
      }

      newLayer = HMSSimulcastLayer.NONE;
    }
    (this.stream as HMSRemoteStream).setVideo(newLayer);
  }
}
