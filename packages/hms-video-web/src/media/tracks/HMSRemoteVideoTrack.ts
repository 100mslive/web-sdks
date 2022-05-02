import { HMSVideoTrack } from './HMSVideoTrack';
import HMSRemoteStream from '../streams/HMSRemoteStream';
import { HMSSimulcastLayer, SimulcastLayerDefinition } from '../../interfaces/simulcast-layers';
import HMSLogger from '../../utils/logger';

interface TrackAction {
  action: 'addSink' | 'removeSink' | 'preferLayer' | 'setDegraded';
  data?: any;
}

class TrackHistory {
  history: TrackAction[] = [];

  push(action: TrackAction) {
    this.history.push(action);
  }
}

export class HMSRemoteVideoTrack extends HMSVideoTrack {
  private _degraded = false;
  private _degradedAt: Date | null = null;
  private _layerDefinitions: SimulcastLayerDefinition[] = [];
  history = new TrackHistory();

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
    if (this.getSimulcastLayer() === layer) {
      HMSLogger.d(`[Remote stream] ${this.stream.id}`, `Already on ${layer} layer`);
      return;
    }
    this.history.push({ action: 'preferLayer', data: { layer } });
    (this.stream as HMSRemoteStream).setVideo(layer);
  }

  getSimulcastLayer() {
    return (this.stream as HMSRemoteStream).getSimulcastLayer();
  }

  addSink(videoElement: HTMLVideoElement) {
    super.addSink(videoElement);
    this.updateLayer();
    this.history.push({ action: 'addSink', data: { layer: this.getSimulcastLayer(), degraded: this.degraded } });
  }

  removeSink(videoElement: HTMLVideoElement) {
    super.removeSink(videoElement);
    this._degraded = false;
    this.updateLayer();
    this.history.push({ action: 'removeSink', data: { layer: this.getSimulcastLayer(), degraded: this.degraded } });
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
      // No need to sent preferLayer update, as server has done it already
      const layer = value ? HMSSimulcastLayer.NONE : HMSSimulcastLayer.HIGH;
      (this.stream as HMSRemoteStream).setVideoLayer(layer);
      this.history.push({ action: 'setDegraded', data: { layer: this.getSimulcastLayer(), degraded: this.degraded } });
      return;
    }

    this.updateLayer();
    this.history.push({ action: 'setDegraded', data: { layer: this.getSimulcastLayer(), degraded: this.degraded } });
  }

  private updateLayer() {
    let newLayer = this.hasSinks() ? HMSSimulcastLayer.HIGH : HMSSimulcastLayer.NONE;
    if (this.degraded) {
      newLayer = HMSSimulcastLayer.NONE;
    }
    if (this.getSimulcastLayer() === newLayer) {
      HMSLogger.d(`[Remote stream] ${this.stream.id}`, `Already on ${newLayer} layer`);
      return;
    }
    (this.stream as HMSRemoteStream).setVideo(newLayer);
  }
}
