import { HMSMediaStream } from './HMSMediaStream';
import HMSSubscribeConnection from '../../connection/subscribe/subscribeConnection';
import { HMSSimulcastLayer } from '../../interfaces';
import HMSLogger from '../../utils/logger';

/** @internal */
export class HMSRemoteStream extends HMSMediaStream {
  private readonly connection: HMSSubscribeConnection;
  private audio = true;
  private video = HMSSimulcastLayer.NONE;

  constructor(nativeStream: MediaStream, connection: HMSSubscribeConnection) {
    super(nativeStream);
    this.connection = connection;
  }

  async setAudio(enabled: boolean, trackId: string, identifier?: string) {
    if (this.audio === enabled) {
      return;
    }

    const previous = this.audio;
    this.audio = enabled;
    HMSLogger.d(
      `[Remote stream] ${identifier || ''} 
    streamId=${this.id}
    trackId=${trackId}
    subscribing audio - ${this.audio}`,
    );
    try {
      await this.connection.sendOverApiDataChannelWithResponse({
        params: {
          subscribed: enabled,
          track_id: trackId,
        },
        method: 'prefer-audio-track-state',
      });
    } catch (error) {
      // the SFU never confirmed this, so leaving the field flipped would dedupe away every later
      // attempt. Only undo our own write - a newer call already holding the field owns it now.
      if (this.audio === enabled) {
        this.audio = previous;
      }
      throw error;
    }
  }

  /**
   * Sets the video layer after receiving new state from SFU. This is used when server side subscribe
   * degradation is ON.
   * @param layer is simulcast layer to be set
   * @param identifier is stream identifier to be printed in logs
   */
  setVideoLayerLocally(layer: HMSSimulcastLayer, identifier: string, source: string) {
    this.video = layer;
    HMSLogger.d(`[Remote stream] ${identifier}
    streamId=${this.id}
    source: ${source}
    Setting layer field to=${layer}`);
  }

  /**
   * Sets the video layer and updates the track state to SFU via api datachannel. This is used when client
   * side subscribe degradation is ON or client unsubscribes the current track.
   * @param layer is simulcast layer to be set
   * @param identifier is stream identifier to be printed in logs
   */
  async setVideoLayer(layer: HMSSimulcastLayer, trackId: string, identifier: string, source: string) {
    HMSLogger.d(
      `[Remote stream] ${identifier} 
      streamId=${this.id}
      trackId=${trackId} 
      source: ${source} request ${layer} layer`,
    );
    const previous = this.video;
    this.setVideoLayerLocally(layer, identifier, source);
    try {
      return await this.connection.sendOverApiDataChannelWithResponse({
        params: {
          max_spatial_layer: layer,
          track_id: trackId,
        },
        method: 'prefer-video-track-state',
      });
    } catch (error) {
      // only undo our own write - see setAudio
      if (this.video === layer) {
        this.setVideoLayerLocally(previous, identifier, `${source}-failed`);
      }
      throw error;
    }
  }

  /**
   * @deprecated
   * @returns {HMSSimulcastLayer}
   */
  getSimulcastLayer() {
    return this.video;
  }

  getVideoLayer() {
    return this.video;
  }

  isAudioSubscribed() {
    return this.audio;
  }
}
