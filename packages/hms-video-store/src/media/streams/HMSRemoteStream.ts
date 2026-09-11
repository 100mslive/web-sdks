import { HMSMediaStream } from './HMSMediaStream';
import { PreferLayerResponse } from '../../connection/channel-messages';
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
  /**
   * Stamped with a sequence rather than matched by value: two requests for the same value can
   * overlap, and an older one settling must not clear the claim of a newer one still on the wire.
   */
  private audioRequest?: { enabled: boolean; seq: number };
  private videoRequest?: { layer: HMSSimulcastLayer; seq: number };
  private seq = 0;

  constructor(nativeStream: MediaStream, connection: HMSSubscribeConnection) {
    super(nativeStream);
    this.connection = connection;
  }

  async setAudio(enabled: boolean, trackId: string, identifier?: string) {
    // the desired value has to match too: a request that failed after the SFU applied it leaves
    // `confirmed` on a value the SFU has already moved off, and deduping on that alone would
    // swallow the very call that corrects it - a peer silent for the rest of the session
    if (this.audio === enabled && this.isAudioSettled(enabled)) {
      return;
    }

    this.audio = enabled;
    const seq = ++this.seq;
    this.audioRequest = { enabled, seq };
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
      if (this.isApplied(response, this.audio === enabled)) {
        this.confirmedAudio = enabled;
      }
    } finally {
      if (this.audioRequest?.seq === seq) {
        this.audioRequest = undefined;
      }
    }
  }

  /** true when the SFU is known to be on `enabled`, or a request for it is already on the wire */
  private isAudioSettled(enabled: boolean) {
    return this.audioRequest ? this.audioRequest.enabled === enabled : this.confirmedAudio === enabled;
  }

  /**
   * A dropped response never reached the SFU and an error - 404 included - is it refusing rather
   * than applying. `stillDesired` covers the rest: a replaced request can be answered after the
   * one that replaced it, and confirming then records a state the SFU has already moved off.
   */
  private isApplied(response: PreferLayerResponse | undefined, stillDesired: boolean) {
    return stillDesired && !response?.dropped && !response?.error;
  }

  /** the SFU telling us where it already is - authoritative, so no request is needed to reach it */
  setVideoLayerFromServer(layer: HMSSimulcastLayer, identifier: string, source: string) {
    this.confirmedVideo = layer;
    // drop any claim still on the wire: it describes a layer the SFU has just contradicted, and
    // isVideoLayerSettled prefers the claim, which would hide this value from the dedupe
    this.videoRequest = undefined;
    this.setVideoLayerLocally(layer, identifier, source);
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
    this.setVideoLayerLocally(layer, identifier, source);
    const seq = ++this.seq;
    this.videoRequest = { layer, seq };
    try {
      const response = await this.connection.sendOverApiDataChannelWithResponse({
        params: {
          max_spatial_layer: this.video,
          track_id: trackId,
        },
        method: 'prefer-video-track-state',
      });
      if (this.isApplied(response, this.video === layer)) {
        this.confirmedVideo = layer;
      }
      return response;
    } finally {
      if (this.videoRequest?.seq === seq) {
        this.videoRequest = undefined;
      }
    }
  }

  /** true when the SFU is known to be on `layer`, or a request for it is already on the wire */
  isVideoLayerSettled(layer: HMSSimulcastLayer) {
    return this.videoRequest ? this.videoRequest.layer === layer : this.confirmedVideo === layer;
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
