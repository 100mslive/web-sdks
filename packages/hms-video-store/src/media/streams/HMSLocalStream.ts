import { HMSMediaStream } from './HMSMediaStream';
import HMSPublishConnection from '../../connection/publish/publishConnection';
import { SimulcastLayer } from '../../interfaces';
import HMSLogger from '../../utils/logger';
import { isNode } from '../../utils/support';
import { HMSAudioTrackSettings, HMSVideoTrackSettings } from '../settings';
import { HMSLocalTrack, HMSLocalVideoTrack } from '../tracks';

export class HMSLocalStream extends HMSMediaStream {
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

  async setMaxBitrateAndFramerate(
    track: HMSLocalTrack,
    updatedSettings?: HMSAudioTrackSettings | HMSVideoTrackSettings,
  ): Promise<void> {
    await this.connection?.setMaxBitrateAndFramerate(track, updatedSettings);
  }

  // @ts-ignore
  setPreferredCodec(_transceiver: RTCRtpTransceiver, _kind: string) {
    // TODO: Some browsers don't support setCodecPreferences, resort to SDPMunging?
  }

  replaceStreamTrack(track: MediaStreamTrack, withTrack: MediaStreamTrack) {
    this.nativeStream.addTrack(withTrack);
    this.nativeStream.removeTrack(track);
  }

  removeSender(track: HMSLocalTrack) {
    if (!this.connection || this.connection.connectionState === 'closed') {
      HMSLogger.d(this.TAG, `publish connection is not initialised or closed`);
      return;
    }
    const sender = track.transceiver?.sender;
    if (!sender) {
      HMSLogger.w(this.TAG, `No sender found for trackId=${track.trackId}`);
      return;
    }
    this.connection?.removeTrack(sender);
    const toRemoveLocalTrackIdx = this.tracks.indexOf(track);
    if (toRemoveLocalTrackIdx !== -1) {
      this.tracks.splice(toRemoveLocalTrackIdx, 1);
    } else {
      HMSLogger.w(this.TAG, `Cannot find ${track.trackId} in locally stored tracks`);
    }
  }

  private getTrackEncodings(track: HMSLocalTrack, simulcastLayers: SimulcastLayer[]) {
    const trackEncodings: RTCRtpEncodingParameters[] = [];
    if (track instanceof HMSLocalVideoTrack) {
      if (simulcastLayers.length > 0) {
        HMSLogger.d(this.TAG, 'Simulcast enabled with layers', simulcastLayers);
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
