import HMSMediaStream from './HMSMediaStream';
import HMSTrack from '../tracks/HMSTrack';
import HMSTrackSettings from '../settings/HMSTrackSettings';
import HMSLocalAudioTrack from '../tracks/HMSLocalAudioTrack';
import HMSLocalVideoTrack from '../tracks/HMSLocalVideoTrack';
import HMSPublishConnection from '../../connection/publish';
import HMSVideoTrackSettings from '../settings/HMSVideoTrackSettings';
import HMSLogger from '../../utils/logger';
import { HMSAction } from '../../error/HMSAction';
import { BuildGetMediaError } from '../../error/HMSErrorFactory';

const TAG = 'HMSLocalStream';

/** @internal */
export default class HMSLocalStream extends HMSMediaStream {
  /** Connection set when publish is called for the first track */
  private connection: HMSPublishConnection | null = null;

  setConnection(connection: HMSPublishConnection) {
    this.connection = connection;
  }

  static async getLocalScreen(settings: HMSVideoTrackSettings) {
    const constraints = {
      video: settings.toConstraints(),
      audio: false,
    } as MediaStreamConstraints;
    let stream;
    try {
      // @ts-ignore [https://github.com/microsoft/TypeScript/issues/33232]
      stream = (await navigator.mediaDevices.getDisplayMedia(constraints)) as MediaStream;
    } catch (err) {
      throw BuildGetMediaError(err, HMSAction.GetLocalScreen);
    }

    const local = new HMSLocalStream(stream);
    const nativeTrack = stream.getVideoTracks()[0];
    const track = new HMSLocalVideoTrack(local, nativeTrack, settings, 'screen');

    HMSLogger.v(TAG, 'getLocalScreen', track);
    return track;
  }

  static async getLocalTracks(settings: HMSTrackSettings) {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: settings.audio != null ? settings.audio!.toConstraints() : false,
        video: settings.video != null ? settings.video!.toConstraints() : false,
      });
    } catch (err) {
      throw BuildGetMediaError(err, HMSAction.GetLocalScreen);
    }

    const local = new HMSLocalStream(stream);
    const tracks: Array<HMSTrack> = [];
    if (settings.audio != null) {
      const nativeTrack = stream.getAudioTracks()[0];
      const track = new HMSLocalAudioTrack(local, nativeTrack, settings.audio, 'regular');
      tracks.push(track);
    }

    if (settings.video != null) {
      const nativeTrack = stream.getVideoTracks()[0];
      const track = new HMSLocalVideoTrack(local, nativeTrack, settings.video, 'regular');
      tracks.push(track);
    }

    HMSLogger.v(TAG, 'getLocalTracks', tracks);
    return tracks;
  }

  addTransceiver(track: HMSTrack) {
    // TODO: Add support for simulcast
    const transceiver = this.connection!.addTransceiver(track.nativeTrack, {
      streams: [this.nativeStream],
      direction: 'sendonly',
      sendEncodings: undefined, // TODO
    });
    this.setPreferredCodec(transceiver, track.nativeTrack.kind);
    return transceiver;
  }

  async setMaxBitrate(maxBitrate: number, track: HMSTrack): Promise<void> {
    await this.connection?.setMaxBitrate(maxBitrate, track);
  }

  // @ts-ignore
  setPreferredCodec(transceiver: RTCRtpTransceiver, kind: string) {
    // TODO: Some browsers don't support setCodecPreferences, resort to SDPMunging?
  }

  async replaceTrack(track: HMSTrack, withTrack: MediaStreamTrack) {
    const sender = this.connection!.getSenders().find((sender) => sender.track && sender.track!.id === track.trackId);

    if (sender === undefined) throw Error(`No sender found for trackId=${track.trackId}`);
    this.nativeStream.addTrack(withTrack);
    this.nativeStream.removeTrack(track.nativeTrack);

    sender.track!.stop(); // If the track is already stopped, this does not throw any error. 😉

    await sender.replaceTrack(withTrack);

    track.nativeTrack = withTrack;
  }

  removeSender(track: HMSTrack) {
    let removedSenderCount = 0;
    this.connection!.getSenders().forEach((sender) => {
      if (sender.track && sender.track.id === track.trackId) {
        this.connection!.removeTrack(sender);
        removedSenderCount += 1;

        // Remove the local reference as well
        const toRemoveLocalTrackIdx = this.tracks.indexOf(track);
        if (toRemoveLocalTrackIdx !== -1) {
          this.tracks.splice(toRemoveLocalTrackIdx, 1);
        } else throw Error(`Cannot find ${track} in locally stored tracks`);
      }
    });
    if (removedSenderCount !== 1) {
      throw Error(`Removed ${removedSenderCount} sender's, expected to remove 1`);
    }
  }

  trackUpdate(track: HMSTrack) {
    this.connection?.trackUpdate(track);
  }
}
