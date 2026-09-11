import { HMSMediaStream } from './HMSMediaStream';
import HMSSubscribeConnection from '../../connection/subscribe/subscribeConnection';
import { HMSSimulcastLayer } from '../../interfaces';
import HMSLogger from '../../utils/logger';
import { workerSleep } from '../../utils/timer-utils';

/** marks a request the stream raised itself, so it does not refill its own budget */
const RECONVERGE = 'reconverge';
/** delays before each re-drive, in ms; the length is the budget */
const RECONVERGE_DELAYS = [1000, 3000, 9000];

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
  /** re-drives spent since the last app-driven request; refilled by one, see RECONVERGE_DELAYS */
  private videoReconvergeUsed = 0;
  private audioReconvergeUsed = 0;

  constructor(nativeStream: MediaStream, connection: HMSSubscribeConnection) {
    super(nativeStream);
    this.connection = connection;
  }

  async setAudio(enabled: boolean, trackId: string, identifier?: string, source?: string) {
    if (source !== RECONVERGE) {
      this.audioReconvergeUsed = 0;
    }
    // set before the dedupe: leaving it behind lets a parked re-drive chase a value the app has
    // already reversed, silencing a peer it explicitly unmuted
    this.audio = enabled;
    if (this.isAudioSettled(enabled)) {
      return;
    }

    this.inFlightAudio = enabled;
    HMSLogger.d(
      `[Remote stream] ${identifier || ''}
    streamId=${this.id}
    trackId=${trackId}
    subscribing audio - ${this.audio}`,
    );
    try {
      await this.sendAudio(enabled, trackId);
    } catch (error) {
      // outside sendAudio, so the re-drive sees the cleared in-flight state rather than its own
      this.reconvergeAudio(trackId, identifier);
      throw error;
    }
  }

  private async sendAudio(enabled: boolean, trackId: string) {
    try {
      const response = await this.connection.sendOverApiDataChannelWithResponse({
        params: {
          subscribed: this.audio,
          track_id: trackId,
        },
        method: 'prefer-audio-track-state',
      });
      // dropped never reached the SFU, and an error (404) is a refusal - neither is state applied
      if (!response?.dropped && !response?.error) {
        this.confirmedAudio = enabled;
      }
    } finally {
      if (this.inFlightAudio === enabled) {
        this.inFlightAudio = undefined;
      }
    }
  }

  /** the audio counterpart of reconvergeVideo; nothing re-sends audio short of a mute */
  private reconvergeAudio(trackId: string, identifier?: string) {
    const delay = RECONVERGE_DELAYS[this.audioReconvergeUsed];
    if (delay === undefined) {
      HMSLogger.e(`[Remote stream] ${identifier || ''} gave up subscribing audio ${this.audio} on ${trackId}`);
      this.connection.reportStuckState({
        method: 'prefer-audio-track-state',
        trackId,
        desired: String(this.audio),
        confirmed: String(this.confirmedAudio),
      });
      return;
    }
    this.audioReconvergeUsed++;
    workerSleep(delay).then(() => {
      if (this.connection.isClosed() || this.inFlightAudio !== undefined || this.confirmedAudio === this.audio) {
        return;
      }
      this.setAudio(this.audio, trackId, identifier, RECONVERGE).catch(() => undefined);
    });
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
    if (source !== RECONVERGE) {
      this.videoReconvergeUsed = 0;
    }
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
        // dropped never reached the SFU, and an error (404) is a refusal - neither is state applied
        if (!response?.dropped && !response?.error) {
          this.confirmedVideo = layer;
        }
        settle();
        return response;
      })
      .catch(error => {
        settle();
        this.reconvergeVideo(trackId, identifier);
        throw error;
      });
  }

  /**
   * Running out of attempts leaves the SFU on a layer nobody asked for, and the only things that
   * re-send are a resize or a sink change - neither of which a settled tile produces.
   */
  private reconvergeVideo(trackId: string, identifier: string) {
    const delay = RECONVERGE_DELAYS[this.videoReconvergeUsed];
    if (delay === undefined) {
      HMSLogger.e(`[Remote stream] ${identifier} gave up reaching layer ${this.video} on ${trackId}`);
      this.connection.reportStuckState({
        method: 'prefer-video-track-state',
        trackId,
        desired: this.video,
        confirmed: this.confirmedVideo,
      });
      return;
    }
    this.videoReconvergeUsed++;
    workerSleep(delay).then(() => {
      if (this.connection.isClosed() || this.inFlightVideo !== undefined || this.confirmedVideo === this.video) {
        return;
      }
      this.setVideoLayer(this.video, trackId, identifier, RECONVERGE).catch(() => undefined);
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
