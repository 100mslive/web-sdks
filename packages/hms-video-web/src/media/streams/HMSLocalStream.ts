import HMSMediaStream from './HMSMediaStream';
import { HMSLocalTrack, HMSLocalVideoTrack } from '../tracks';
import HMSPublishConnection from '../../connection/publish';
import HMSLogger from '../../utils/logger';
import { SimulcastLayer } from '../../interfaces';
import { isNode } from '../../utils/support';

const TAG = 'HMSLocalStream';

export default class HMSLocalStream extends HMSMediaStream {
  /** Connection set when publish is called for the first track */
  private connection: HMSPublishConnection | null = null;

  setConnection(connection: HMSPublishConnection) {
    this.connection = connection;
  }

  addTransceiver(track: HMSLocalTrack, simulcastLayers: SimulcastLayer[]) {
    let trackEncodings: RTCRtpEncodingParameters[] = [];
    if (track instanceof HMSLocalVideoTrack) {
      if (simulcastLayers.length > 0) {
        HMSLogger.v(TAG, 'Simulcast enabled with layers', simulcastLayers);
        trackEncodings.push(...simulcastLayers);
      } else {
        const encodings: RTCRtpEncodingParameters = { active: this.nativeStream.active };
        if (track.settings.maxBitrate && !isNode) {
          encodings.maxBitrate = track.settings.maxBitrate;
        }
        trackEncodings.push(encodings);
      }
    }

    const transceiver = this.connection!.addTransceiver(track.nativeTrack, {
      streams: [this.nativeStream],
      direction: 'sendonly',
      sendEncodings: trackEncodings,
    });
    this.setPreferredCodec(transceiver, track.nativeTrack.kind);
    return transceiver;
  }

  async setMaxBitrate(maxBitrate: number, track: HMSLocalTrack): Promise<void> {
    await this.connection?.setMaxBitrate(maxBitrate, track);
  }

  // @ts-ignore
  setPreferredCodec(transceiver: RTCRtpTransceiver, kind: string) {
    // TODO: Some browsers don't support setCodecPreferences, resort to SDPMunging?
  }

  /**
   * On mute and unmute of video tracks as well as for changing cameras, we replace the track using replaceTrack api
   * so as to avoid a renegotiation with the backend and reflect changes faster.
   * @param track - the current track
   * @param withTrack - the track to replace it with
   */
  async replaceTrack(track: MediaStreamTrack, withTrack: MediaStreamTrack) {
    await this.replaceSenderTrack(track, withTrack);
    track.stop(); // If the track is already stopped, this does not throw any error. 😉
    this.replaceStreamTrack(track, withTrack);
  }

  replaceStreamTrack(track: MediaStreamTrack, withTrack: MediaStreamTrack) {
    this.nativeStream.addTrack(withTrack);
    this.nativeStream.removeTrack(track);
  }

  /**
   * In case of video plugins we need to replace the track sent to remote without stopping the original one. As
   * if the original is stopped, plugin would stop getting input frames to process. So only the track in the
   * sender needs to be replaced.
   */
  async replaceSenderTrack(track: MediaStreamTrack, withTrack: MediaStreamTrack) {
    const sender = this.connection?.getSenders().find((sender) => sender.track && sender.track!.id === track.id);

    if (sender === undefined) {
      HMSLogger.w(TAG, `No sender found for trackId=${track.id}`);
      return;
    }
    await sender.replaceTrack(withTrack);
  }

  removeSender(track: HMSLocalTrack) {
    let removedSenderCount = 0;
    this.connection!.getSenders().forEach((sender) => {
      if (sender.track?.id === track.trackId || sender.track?.id === track.getTrackIDBeingSent()) {
        this.connection!.removeTrack(sender);
        removedSenderCount += 1;

        // Remove the local reference as well
        const toRemoveLocalTrackIdx = this.tracks.indexOf(track);
        if (toRemoveLocalTrackIdx !== -1) {
          this.tracks.splice(toRemoveLocalTrackIdx, 1);
        } else {
          HMSLogger.e(TAG, `Cannot find ${track.trackId} in locally stored tracks`);
        }
      }
    });
    if (removedSenderCount !== 1) {
      HMSLogger.e(TAG, `Removed ${removedSenderCount} sender's, expected to remove 1`);
    }
  }

  trackUpdate(track: HMSLocalTrack) {
    this.connection?.trackUpdate(track);
  }
}
