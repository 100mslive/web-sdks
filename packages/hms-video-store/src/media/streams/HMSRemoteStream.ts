import { HMSMediaStream } from './HMSMediaStream';
import HMSSubscribeConnection from '../../connection/subscribe/subscribeConnection';
import { HMSSimulcastLayer } from '../../interfaces';
import HMSLogger from '../../utils/logger';

/** @internal */
export class HMSRemoteStream extends HMSMediaStream {
  private readonly connection: HMSSubscribeConnection;
  private audio = true;
  private video = HMSSimulcastLayer.NONE;
  /**
   * `audio` and `video` hold the state we want; these two pairs say how far it got. Repeat requests
   * dedupe against the desired value, so without them a request the SFU never applied - the first
   * of a session is the one at risk - silently swallows every later attempt to reach that same
   * state and the track never recovers. Deduping needs both: `confirmed` alone would re-send on
   * every resize while a request is still in flight.
   */
  private confirmedAudio = true;
  private confirmedVideo = HMSSimulcastLayer.NONE;
  private inFlightAudio?: boolean;
  private inFlightVideo?: HMSSimulcastLayer;

  constructor(nativeStream: MediaStream, connection: HMSSubscribeConnection) {
    super(nativeStream);
    this.connection = connection;
  }

  async setAudio(enabled: boolean, trackId: string, identifier?: string) {
    if (this.isAudioSettled(enabled)) {
      return;
    }

    this.audio = enabled;
    this.inFlightAudio = enabled;
    HMSLogger.d(
      `[Remote stream] ${identifier || ''}
    streamId=${this.id}
    trackId=${trackId}
    subscribing audio - ${this.audio}`,
    );
    try {
      const response = await this.connection.sendOverApiDataChannelWithResponse({
        params: {
          subscribed: this.audio,
          track_id: trackId,
        },
        method: 'prefer-audio-track-state',
      });
      // a dropped response never reached the SFU; the request that replaced this one owns the state
      if (!response?.dropped) {
        this.confirmedAudio = enabled;
      }
    } finally {
      if (this.inFlightAudio === enabled) {
        this.inFlightAudio = undefined;
      }
    }
  }

  /** true when the SFU is known to be on `enabled`, or a request for it is already on the wire */
  private isAudioSettled(enabled: boolean) {
    return this.inFlightAudio === undefined ? this.confirmedAudio === enabled : this.inFlightAudio === enabled;
  }

  /**
   * Sets the video layer after receiving new state from SFU. This is used when server side subscribe
   * degradation is ON.
   * @param layer is simulcast layer to be set
   * @param identifier is stream identifier to be printed in logs
   */
  /** the SFU telling us where it already is - authoritative, so no request is needed to reach it */
  setVideoLayerFromServer(layer: HMSSimulcastLayer, identifier: string, source: string) {
    this.confirmedVideo = layer;
    this.setVideoLayerLocally(layer, identifier, source);
  }

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
  setVideoLayer(layer: HMSSimulcastLayer, trackId: string, identifier: string, source: string) {
    HMSLogger.d(
      `[Remote stream] ${identifier} 
      streamId=${this.id}
      trackId=${trackId} 
      source: ${source} request ${layer} layer`,
    );
    this.setVideoLayerLocally(layer, identifier, source);
    this.inFlightVideo = layer;
    const settle = () => {
      if (this.inFlightVideo === layer) {
        this.inFlightVideo = undefined;
      }
    };
    return this.connection
      .sendOverApiDataChannelWithResponse({
        params: {
          max_spatial_layer: this.video,
          track_id: trackId,
        },
        method: 'prefer-video-track-state',
      })
      .then(response => {
        // a dropped response never reached the SFU; the request that replaced this one owns the layer
        if (!response?.dropped) {
          this.confirmedVideo = layer;
        }
        settle();
        return response;
      })
      .catch(error => {
        settle();
        throw error;
      });
  }

  /** true when the SFU is known to be on `layer`, or a request for it is already on the wire */
  isVideoLayerSettled(layer: HMSSimulcastLayer) {
    return this.inFlightVideo === undefined ? this.confirmedVideo === layer : this.inFlightVideo === layer;
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
