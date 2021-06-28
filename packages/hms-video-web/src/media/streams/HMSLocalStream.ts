import HMSMediaStream from './HMSMediaStream';
import HMSTrack from '../tracks/HMSTrack';
import HMSTrackSettings from '../settings/HMSTrackSettings';
import HMSLocalAudioTrack from '../tracks/HMSLocalAudioTrack';
import HMSLocalVideoTrack from '../tracks/HMSLocalVideoTrack';
import HMSPublishConnection from '../../connection/publish';
import HMSVideoTrackSettings, { HMSVideoTrackSettingsBuilder } from '../settings/HMSVideoTrackSettings';
import HMSLogger from '../../utils/logger';
import { BuildGetMediaError, HMSGetMediaActions } from '../../error/utils';
import { getAudioTrack, getEmptyAudioTrack, getEmptyVideoTrack, getVideoTrack } from '../../utils/track';
import { HMSAudioTrackSettingsBuilder } from '../settings/HMSAudioTrackSettings';
import { validateDeviceAV } from '../../utils/device-error';

const TAG = 'HMSLocalStream';

export type HMSLocalTrack = HMSLocalAudioTrack | HMSLocalVideoTrack;

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
      throw BuildGetMediaError(err, HMSGetMediaActions.SCREEN);
    }

    const local = new HMSLocalStream(stream);
    const nativeTrack = stream.getVideoTracks()[0];
    const track = new HMSLocalVideoTrack(local, nativeTrack, 'screen', settings);

    HMSLogger.v(TAG, 'getLocalScreen', track);
    return track;
  }

  static async getLocalTracks(settings: HMSTrackSettings): Promise<Array<HMSLocalTrack>> {
    // @TODO(eswar): starts and stops new tracks to check failures, increases join time(by 600ms).
    // Use same tracks for quicker join.
    await validateDeviceAV();
    const nativeVideoTrack = await getVideoTrack(settings.video);
    const nativeAudioTrack = await getAudioTrack(settings.audio);
    const local = new HMSLocalStream(new MediaStream([nativeVideoTrack, nativeAudioTrack]));

    const tracks: Array<HMSLocalTrack> = [];
    if (settings.audio != null) {
      const audioTrack = new HMSLocalAudioTrack(local, nativeAudioTrack, 'regular', settings.audio);
      tracks.push(audioTrack);
    }

    if (settings.video != null) {
      const videoTrack = new HMSLocalVideoTrack(local, nativeVideoTrack, 'regular', settings.video);
      tracks.push(videoTrack);
    }

    HMSLogger.v(TAG, 'getLocalTracks', tracks);
    return tracks;
  }

  static async getEmptyLocalTracks(
    empty = { audio: false, video: false },
    settings?: HMSTrackSettings,
  ): Promise<Array<HMSLocalTrack>> {
    const nativeVideoTrack = empty.video ? getEmptyVideoTrack() : await getVideoTrack(settings?.video || null);
    const nativeAudioTrack = empty.audio ? getEmptyAudioTrack() : await getAudioTrack(settings?.audio || null);
    const local = new HMSLocalStream(new MediaStream([nativeVideoTrack, nativeAudioTrack]));

    const videoTrackSettings = settings?.video || new HMSVideoTrackSettingsBuilder().build();
    const videoTrack = new HMSLocalVideoTrack(local, nativeVideoTrack, 'regular', videoTrackSettings);

    const audioTrackSettings = settings?.audio || new HMSAudioTrackSettingsBuilder().build();
    const audioTrack = new HMSLocalAudioTrack(local, nativeAudioTrack, 'regular', audioTrackSettings);

    return [audioTrack, videoTrack];
  }

  addTransceiver(track: HMSTrack) {
    // TODO: Add support for simulcast
    let trackEncondings: RTCRtpEncodingParameters = { active: this.nativeStream.active };
    if (track instanceof HMSLocalVideoTrack && track.settings.maxBitrate) {
      trackEncondings.maxBitrate = track.settings.maxBitrate;
    }

    const transceiver = this.connection!.addTransceiver(track.nativeTrack, {
      streams: [this.nativeStream],
      direction: 'sendonly',
      sendEncodings: [trackEncondings],
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
    const sender = this.connection!.getSenders().find((sender) => sender.track?.id === track.trackId);

    if (sender === undefined) {
      // Not throwing an error as this is not a fatal error
      HMSLogger.e(TAG, 'No sender found for trackId', track.trackId);
      return;
    }
    this.nativeStream.addTrack(withTrack);
    this.nativeStream.removeTrack(track.nativeTrack);

    sender.track!.stop(); // If the track is already stopped, this does not throw any error. 😉

    await sender.replaceTrack(withTrack);

    track.nativeTrack = withTrack;
  }

  removeSender(track: HMSTrack) {
    let removedSenderCount = 0;
    this.connection!.getSenders().forEach((sender) => {
      if (sender.track?.id === track.trackId) {
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
