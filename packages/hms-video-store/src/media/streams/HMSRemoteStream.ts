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
   * Bumped per request so a failed one can tell whether it still owns the field. Both fields are
   * written before the SFU confirms - they have to be, because they are what dedupes the next
   * call - so an unconfirmed request has to put them back or every later call is deduped away.
   */
  private audioSeq = 0;
  private videoSeq = 0;

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
    const seq = ++this.audioSeq;
    HMSLogger.d(
      `[Remote stream] ${identifier || ''} 
    streamId=${this.id}
    trackId=${trackId}
    subscribing audio - ${this.audio}`,
    );
    try {
      await this.connection.sendOverApiDataChannelWithResponse(
        {
          params: {
            subscribed: enabled,
            track_id: trackId,
          },
          method: 'prefer-audio-track-state',
        },
        undefined,
        () => seq !== this.audioSeq,
      );
    } catch (error) {
      // the SFU never confirmed this, so leaving the field flipped would dedupe away every later
      // attempt. A superseded request must not roll back - the newer one owns the field now.
      if (seq === this.audioSeq) {
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
    const seq = ++this.videoSeq;
    try {
      return await this.connection.sendOverApiDataChannelWithResponse(
        {
          params: {
            max_spatial_layer: layer,
            track_id: trackId,
          },
          method: 'prefer-video-track-state',
        },
        undefined,
        () => seq !== this.videoSeq,
      );
    } catch (error) {
      if (seq === this.videoSeq) {
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
