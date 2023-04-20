import HMSMediaStream from './HMSMediaStream';
import HMSPublishConnection from '../../connection/publish/publishConnection';
import { SimulcastLayer } from '../../interfaces';
import { stringifyMediaStreamTrack } from '../../utils/json';
import HMSLogger from '../../utils/logger';
import { isNode } from '../../utils/support';
import { HMSLocalTrack, HMSLocalVideoTrack } from '../tracks';

export default class HMSLocalStream extends HMSMediaStream {
  /** Connection set when publish is called for the first track */
  private readonly TAG = '[HMSLocalStream]';
  private connection: HMSPublishConnection | null = null;

  setConnection(connection: HMSPublishConnection) {
    this.connection = connection;
  }

  addTransceiver(track: HMSLocalTrack, simulcastLayers: SimulcastLayer[]) {
    const transceiver = this.connection!.addTransceiver(track.getTrackBeingSent(), {
      streams: [this.nativeStream],
      direction: 'sendonly',
      sendEncodings: this.getTrackEncodings(track, simulcastLayers),
    });
    this.setPreferredCodec(transceiver, track.nativeTrack.kind);
    track.transceiver = transceiver;
    return transceiver;
  }

  async setMaxBitrateAndFramerate(track: HMSLocalTrack): Promise<void> {
    await this.connection?.setMaxBitrateAndFramerate(track);
  }

  // @ts-ignore
  setPreferredCodec(_transceiver: RTCRtpTransceiver, _kind: string) {
    // TODO: Some browsers don't support setCodecPreferences, resort to SDPMunging?
  }

  replaceStreamTrack(track: MediaStreamTrack, withTrack: MediaStreamTrack) {
    this.nativeStream.addTrack(withTrack);
    this.nativeStream.removeTrack(track);
    HMSLogger.d(
      this.TAG,
      'Native stream tracks after replace',
      this.nativeStream.getAudioTracks().map(stringifyMediaStreamTrack),
      `prev Track - ${stringifyMediaStreamTrack(track)}`,
      `new Track - ${stringifyMediaStreamTrack(withTrack)}`,
    );
  }

  /**
   * On mute and unmute of video tracks as well as for changing cameras, we replace the track with new track,
   * so as to avoid a renegotiation with the backend and reflect changes faster.
   * In case of video plugins we need to replace the track sent to remote without stopping the original one. As
   * if the original is stopped, plugin would stop getting input frames to process. So only the track in the
   * sender needs to be replaced.
   */
  async replaceSenderTrack(track: MediaStreamTrack, withTrack: MediaStreamTrack) {
    if (!this.connection || this.connection.connectionState === 'closed') {
      HMSLogger.d(this.TAG, `publish connection is not initialised or closed`);
      return;
    }
    const sender = this.connection.getSenders().find(sender => sender.track && sender.track.id === track.id);

    if (sender === undefined) {
      HMSLogger.w(this.TAG, `No sender found for trackId=${track.id}`);
      return;
    }
    await sender.replaceTrack(withTrack);
  }

  removeSender(track: HMSLocalTrack) {
    if (!this.connection || this.connection.connectionState === 'closed') {
      HMSLogger.d(this.TAG, `publish connection is not initialised or closed`);
      return;
    }
    const sender = track.transceiver?.sender;
    if (!sender) {
      HMSLogger.e(this.TAG, `No sender found for trackId=${track.trackId}`);
      return;
    }
    this.connection?.removeTrack(sender);
    const toRemoveLocalTrackIdx = this.tracks.indexOf(track);
    if (toRemoveLocalTrackIdx !== -1) {
      this.tracks.splice(toRemoveLocalTrackIdx, 1);
    } else {
      HMSLogger.e(this.TAG, `Cannot find ${track.trackId} in locally stored tracks`);
    }
  }

  private getTrackEncodings(track: HMSLocalTrack, simulcastLayers: SimulcastLayer[]) {
    const trackEncodings: RTCRtpEncodingParameters[] = [];
    if (track instanceof HMSLocalVideoTrack) {
      if (simulcastLayers.length > 0) {
        HMSLogger.v(this.TAG, 'Simulcast enabled with layers', simulcastLayers);
        trackEncodings.push(...simulcastLayers);
      } else {
        const encodings: RTCRtpEncodingParameters = { active: this.nativeStream.active };
        if (track.settings.maxBitrate && !isNode) {
          encodings.maxBitrate = track.settings.maxBitrate;
        }
        trackEncodings.push(encodings);
      }
    }
    return trackEncodings;
  }
}
