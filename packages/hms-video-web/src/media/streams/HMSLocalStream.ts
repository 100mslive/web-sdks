import HMSMediaStream from './HMSMediaStream';
import HMSPublishConnection from '../../connection/publish/publishConnection';
import { SimulcastLayer } from '../../interfaces';
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

  async addTransceiver(track: HMSLocalTrack, simulcastLayers: SimulcastLayer[]) {
    const trackEncodings: RTCRtpEncodingParameters[] = [];
    const isVideoTrack = track instanceof HMSLocalVideoTrack;
    if (isVideoTrack && simulcastLayers.length) {
      HMSLogger.v(this.TAG, 'Simulcast enabled with layers', simulcastLayers);
      trackEncodings.push(...simulcastLayers);
    } else {
      trackEncodings.push({ active: track.enabled });
    }

    const transceiver = this.connection!.addTransceiver(track.getTrackBeingSent(), {
      streams: [this.nativeStream],
      direction: 'sendonly',
      sendEncodings: trackEncodings,
    });
    await this.setParameters(track, transceiver);
    this.setPreferredCodec(transceiver, track.nativeTrack.kind);
  }

  // @ts-ignore
  setPreferredCodec(_transceiver: RTCRtpTransceiver, _kind: string) {
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
    let removedSenderCount = 0;
    this.connection?.getSenders().forEach(sender => {
      if (sender.track?.id === track.trackId || sender.track?.id === track.getTrackIDBeingSent()) {
        this.connection!.removeTrack(sender);
        removedSenderCount += 1;

        // Remove the local reference as well
        const toRemoveLocalTrackIdx = this.tracks.indexOf(track);
        if (toRemoveLocalTrackIdx !== -1) {
          this.tracks.splice(toRemoveLocalTrackIdx, 1);
        } else {
          HMSLogger.e(this.TAG, `Cannot find ${track.trackId} in locally stored tracks`);
        }
      }
    });
    if (removedSenderCount !== 1) {
      HMSLogger.e(this.TAG, `Removed ${removedSenderCount} sender's, expected to remove 1`);
    }
  }

  getSender(track: HMSLocalTrack) {
    return this.connection
      ?.getSenders()
      .find(sender => sender.track?.id === track.trackId || sender.track?.id === track.getTrackIDBeingSent());
  }

  hasSender(track: HMSLocalTrack): boolean {
    return !!this.getSender(track);
  }

  trackUpdate(track: HMSLocalTrack) {
    this.connection?.trackUpdate(track);
  }

  private async setParameters(track: HMSLocalTrack, transceiver: RTCRtpTransceiver) {
    const params = transceiver.sender.getParameters();
    if (isNode || params.encodings.length > 1) {
      return;
    }
    if (track.settings.maxBitrate) {
      params.encodings[0].maxBitrate = track.settings.maxBitrate * 1000;
    }
    //@ts-ignore
    params.encodings[0].maxFrameRate = track.settings.maxFrameRate;
    params.degradationPreference = track.source === 'screen' ? 'maintain-framerate' : 'maintain-resolution';
    try {
      await transceiver.sender.setParameters(params);
    } catch (error) {
      HMSLogger.w(
        this.TAG,
        'error setting parameters on transceiver for track -',
        `${track}`,
        (error as Error).message,
      );
    }
  }
}
