import { HMSVideoTrack } from './HMSVideoTrack';
import { VideoElementManager } from './VideoElementManager';
import { VideoTrackLayerUpdate } from '../../connection/channel-messages';
import {
  HMSPreferredSimulcastLayer,
  HMSSimulcastLayer,
  HMSSimulcastLayerDefinition,
} from '../../interfaces/simulcast-layers';
import { MAINTAIN_TRACK_HISTORY } from '../../utils/constants';
import HMSLogger from '../../utils/logger';
import HMSRemoteStream from '../streams/HMSRemoteStream';

export class HMSRemoteVideoTrack extends HMSVideoTrack {
  private _degraded = false;
  private _degradedAt: Date | null = null;
  private _layerDefinitions: HMSSimulcastLayerDefinition[] = [];
  private history = new TrackHistory();
  private preferredLayer: HMSPreferredSimulcastLayer = HMSSimulcastLayer.HIGH;

  constructor(stream: HMSRemoteStream, track: MediaStreamTrack, source?: string) {
    super(stream, track, source);
    this.setVideoHandler(new VideoElementManager(this));
  }

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

    super.setEnabled(value);
    this.videoHandler.updateSinks();
  }

  async setPreferredLayer(layer: HMSPreferredSimulcastLayer) {
    //@ts-ignore
    if (layer === HMSSimulcastLayer.NONE) {
      HMSLogger.w(`layer ${HMSSimulcastLayer.NONE} will be ignored`);
      return;
    }
    this.preferredLayer = layer;
    if (!this.shouldSendVideoLayer(layer, 'preferLayer')) {
      return;
    }
    if (!this.hasSinks()) {
      HMSLogger.d(
        `[Remote Track] ${this.logIdentifier}
        streamId=${this.stream.id} 
        trackId=${this.trackId}
        saving ${layer}, source=${this.source}
        Track does not have any sink`,
      );
      return;
    }
    await this.requestLayer(layer, 'preferLayer');
    this.pushInHistory(`uiPreferLayer-${layer}`);
  }

  /**
   * @deprecated
   * @returns {HMSSimulcastLayer}
   */
  getSimulcastLayer() {
    return (this.stream as HMSRemoteStream).getSimulcastLayer();
  }

  getLayer() {
    return (this.stream as HMSRemoteStream).getVideoLayer();
  }

  getPreferredLayer() {
    return this.preferredLayer;
  }

  async addSink(videoElement: HTMLVideoElement) {
    super.addSink(videoElement);
    await this.updateLayer('addSink');
    this.pushInHistory(`uiSetLayer-high`);
  }

  async removeSink(videoElement: HTMLVideoElement) {
    super.removeSink(videoElement);
    await this.updateLayer('removeSink');
    this._degraded = false;
    this.pushInHistory('uiSetLayer-none');
  }

  /**
   * Method to get available simulcast definitions for the track
   * @returns {HMSSimulcastLayerDefinition[]}
   */
  getSimulcastDefinitions() {
    // send a clone to store as it will freeze the object from further updates
    return [...this._layerDefinitions];
  }

  /** @internal */
  setSimulcastDefinitons(definitions: HMSSimulcastLayerDefinition[]) {
    this._layerDefinitions = definitions;
  }

  /**
   * @internal
   * SFU will change track's layer(degrade or restore) and tell the sdk to update
   * it locally.
   * @returns {boolean} isDegraded - returns true if degraded
   * */
  setLayerFromServer(layerUpdate: VideoTrackLayerUpdate) {
    this._degraded =
      (layerUpdate.publisher_degraded || layerUpdate.subscriber_degraded) &&
      layerUpdate.current_layer === HMSSimulcastLayer.NONE;
    this._degradedAt = this._degraded ? new Date() : this._degradedAt;
    const currentLayer = layerUpdate.current_layer;
    HMSLogger.d(
      `[Remote Track] ${this.logIdentifier} 
      streamId=${this.stream.id} 
      trackId=${this.trackId}
      layer update from sfu
      currLayer=${layerUpdate.current_layer}
      preferredLayer=${layerUpdate.expected_layer}
      sub_degraded=${layerUpdate.subscriber_degraded}
      pub_degraded=${layerUpdate.publisher_degraded}
      isDegraded=${this._degraded}`,
    );
    // No need to send preferLayer update, as server has done it already
    (this.stream as HMSRemoteStream).setVideoLayerLocally(currentLayer, this.logIdentifier, 'setLayerFromServer');
    this.pushInHistory(`sfuLayerUpdate-${currentLayer}`);
    return this._degraded;
  }

  /**
   * @internal
   * If degradation is being managed by sdk, sdk will let the track know of status
   * post which it'll set it as well and send prefer layer message to SFU.
   * */
  setDegradedFromSdk(value: boolean) {
    this._degraded = value;
    this._degradedAt = value ? new Date() : this._degradedAt;
    this.updateLayer('sdkDegradation');
    this.pushInHistory(value ? 'sdkDegraded-none' : 'sdkRecovered-high');
  }

  private async updateLayer(source: string) {
    const newLayer = this.degraded || !this.hasSinks() ? HMSSimulcastLayer.NONE : this.preferredLayer;
    if (!this.shouldSendVideoLayer(newLayer, source)) {
      return;
    }
    await this.requestLayer(newLayer, source);
  }

  private pushInHistory(action: string) {
    if (MAINTAIN_TRACK_HISTORY) {
      this.history.push({ name: action, layer: this.getLayer(), degraded: this.degraded });
    }
  }

  private async requestLayer(layer: HMSSimulcastLayer, source: string) {
    try {
      const response = await (this.stream as HMSRemoteStream).setVideoLayer(
        layer,
        this.trackId,
        this.logIdentifier,
        source,
      );
      HMSLogger.d(
        `[Remote Track] ${this.logIdentifier} 
      streamId=${this.stream.id}
      trackId=${this.trackId}
      Requested layer ${layer}, source=${source}`,
      );
      return response;
    } catch (error) {
      HMSLogger.d(
        `[Remote Track] ${this.logIdentifier} 
      streamId=${this.stream.id}
      trackId=${this.trackId}
      Failed to set layer ${layer}, source=${source}
      error=${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * given the new layer, figure out if the update should be sent to server or not.
   * It won't be sent if the track is already on the targetLayer. If the track is
   * degraded though and the target layer is none, update will be sent.
   * If there are tracks degraded on a page and user paginates away to other page,
   * it's necessary to send the layer none message to SFU so it knows that the app
   * is no longer interested in the track and doesn't recover degraded tracks on non
   * visible pages.
   *
   * TODO: if track is degraded, send the update if target layer is lower than current layer
   * @private
   */
  private shouldSendVideoLayer(targetLayer: HMSSimulcastLayer, source: string) {
    const currLayer = this.getLayer();
    if (this.degraded && targetLayer === HMSSimulcastLayer.NONE) {
      return true;
    }
    if (currLayer === targetLayer) {
      HMSLogger.d(
        `[Remote Track] ${this.logIdentifier}`,
        `Not sending update, already on layer ${targetLayer}, source=${source}`,
      );
      return false;
    }
    return true;
  }
}

/**
 * to store history of everything that happened to a remote track which decides
 * it's current layer and degraded status.
 */
class TrackHistory {
  history: Record<string, any>[] = [];

  push(action: Record<string, any>) {
    action.time = new Date().toISOString().split('T')[1];
    this.history.push(action);
  }
}
