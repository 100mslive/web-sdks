import { HMSVideoTrack } from './HMSVideoTrack';
import HMSRemoteStream from '../streams/HMSRemoteStream';
import { HMSSimulcastLayer, SimulcastLayerDefinition } from '../../interfaces/simulcast-layers';
import { VideoTrackLayerUpdate } from '../../connection/channel-messages';
import HMSLogger from '../../utils/logger';
import { MAINTAIN_TRACK_HISTORY } from '../../utils/constants';

export class HMSRemoteVideoTrack extends HMSVideoTrack {
  private _degraded = false;
  private _degradedAt: Date | null = null;
  private _layerDefinitions: SimulcastLayerDefinition[] = [];
  private history = new TrackHistory();
  private layerWhenRemoveSink?: HMSSimulcastLayer;

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

    await super.setEnabled(value);
  }

  async preferLayer(layer: Exclude<HMSSimulcastLayer, HMSSimulcastLayer.NONE>) {
    //@ts-ignore
    if (layer === HMSSimulcastLayer.NONE) {
      HMSLogger.w(`layer ${HMSSimulcastLayer.NONE} will be ignored`);
      return;
    }
    if (!this.shouldSendVideoLayer(layer, 'preferLayer')) {
      return;
    }
    if (!this.hasSinks()) {
      this.layerWhenRemoveSink = layer;
      (this.stream as HMSRemoteStream).setVideoLayerLocally(layer, this.logIdentifier, 'preferLayer');
      HMSLogger.d(
        `[Remote Track] ${this.logIdentifier}`,
        `Track does not have any sink, saving ${layer}, source=${this.source}`,
      );
      return;
    }
    const updated = await this.requestLayer(layer, 'preferLayer');
    if (updated) {
      this.pushInHistory(`uiPreferLayer-${layer}`);
    }
  }

  getSimulcastLayer() {
    return (this.stream as HMSRemoteStream).getSimulcastLayer();
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

  /**
   * @internal
   * SFU will change track's layer(degrade or restore) and tell the sdk to update
   * it locally.
   * @returns {boolean} isDegraded - returns true if degraded
   * */
  setLayerFromServer(layerUpdate: VideoTrackLayerUpdate) {
    const isDegraded = layerUpdate.subscriber_degraded;
    this._degraded = isDegraded;
    this._degradedAt = isDegraded ? new Date() : this._degradedAt;
    const currentLayer = layerUpdate.current_layer;
    // No need to send preferLayer update, as server has done it already
    (this.stream as HMSRemoteStream).setVideoLayerLocally(currentLayer, this.logIdentifier, 'setLayerFromServer');
    this.pushInHistory(`sfuLayerUpdate-${currentLayer}`);
    return isDegraded;
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
    const newLayer =
      this.degraded || !this.hasSinks() ? HMSSimulcastLayer.NONE : this.layerWhenRemoveSink || HMSSimulcastLayer.HIGH;
    if (!this.shouldSendVideoLayer(newLayer, source)) {
      return;
    }
    await this.requestLayer(newLayer, source);
    this.layerWhenRemoveSink = undefined;
  }

  private pushInHistory(action: string) {
    if (MAINTAIN_TRACK_HISTORY) {
      this.history.push({ name: action, layer: this.getSimulcastLayer(), degraded: this.degraded });
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
      if (response) {
        const layerUpdate = response.result;
        this.setLayerFromServer(layerUpdate);
        HMSLogger.d(
          `[Remote Track] ${this.logIdentifier} source:${source}`,
          `expected_layer: ${layerUpdate.expected_layer}, current_layer: ${layerUpdate.current_layer}`,
          `subscriber_degraded: ${layerUpdate.subscriber_degraded}, publisher_degraded: ${layerUpdate.publisher_degraded}`,
        );
      }
      return true;
    } catch (error) {
      HMSLogger.d(
        `[Remote Track] ${this.logIdentifier}`,
        `Failed to set layer ${layer}, source=${this.source}, ${(error as Error).message}`,
      );
      return false;
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
    const currLayer = this.getSimulcastLayer();
    if (this.degraded && targetLayer === HMSSimulcastLayer.NONE) {
      return true;
    }
    //if there is layerWhenRemoveSink there is a possibility of layer not being sent to server
    // evne if current and target layer is same
    if (currLayer === targetLayer && !this.layerWhenRemoveSink) {
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
