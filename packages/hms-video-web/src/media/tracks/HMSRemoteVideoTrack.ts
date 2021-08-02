import { HMSVideoTrack } from './HMSVideoTrack';
import HMSRemoteStream from '../streams/HMSRemoteStream';
import { HMSSimulcastLayer } from '../settings';
import { SimulcastLayerDefinition } from '../../interfaces/simulcast-layers';

export class HMSRemoteVideoTrack extends HMSVideoTrack {
  private _degraded = false;
  private _layerDefinitions: SimulcastLayerDefinition[] = [];

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
    this.updateLayer();
  }

  private updateLayer() {
    let newLayer = this.hasSinks() ? HMSSimulcastLayer.MEDIUM : HMSSimulcastLayer.NONE;
    if (this.degraded) newLayer = HMSSimulcastLayer.NONE;
    (this.stream as HMSRemoteStream).setVideo(newLayer);
  }
}
