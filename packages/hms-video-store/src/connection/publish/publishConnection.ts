import { IPublishConnectionObserver } from './IPublishConnectionObserver';
import { HMSLocalTrack, HMSLocalVideoTrack } from '../../internal';
import { HMSAudioTrackSettings, HMSVideoTrackSettings } from '../../media/settings';
import JsonRpcSignal from '../../signal/jsonrpc';
import { API_DATA_CHANNEL } from '../../utils/constants';
import HMSLogger from '../../utils/logger';
import HMSConnection from '../HMSConnection';
import { HMSConnectionRole } from '../model';

export default class HMSPublishConnection extends HMSConnection {
  private readonly TAG = '[HMSPublishConnection]';
  protected readonly observer: IPublishConnectionObserver;
  readonly nativeConnection: RTCPeerConnection;
  readonly channel: RTCDataChannel;

  constructor(signal: JsonRpcSignal, config: RTCConfiguration, observer: IPublishConnectionObserver) {
    super(HMSConnectionRole.Publish, signal);
    this.observer = observer;

    this.nativeConnection = new RTCPeerConnection(config);
    this.channel = this.nativeConnection.createDataChannel(API_DATA_CHANNEL, {
      protocol: 'SCTP',
    });
    this.channel.onerror = ev => HMSLogger.e(this.TAG, `publish data channel onerror ${ev}`, ev);

    this.nativeConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.observer.onIceCandidate(candidate);
        signal.trickle(this.role, candidate);
      }
    };

    this.nativeConnection.oniceconnectionstatechange = () => {
      this.observer.onIceConnectionChange(this.nativeConnection.iceConnectionState);
    };

    this.nativeConnection.onconnectionstatechange = () => {
      this.observer.onConnectionStateChange(this.nativeConnection.connectionState);

      // here it replaces the original listener if already present and
      // handles cases where sctp transport is reinitialised
      if (this.nativeConnection.sctp) {
        this.nativeConnection.sctp.transport.onstatechange = () => {
          this.observer.onDTLSTransportStateChange(this.nativeConnection.sctp?.transport.state);
        };
        this.nativeConnection.sctp.transport.onerror = (event: Event) => {
          this.observer.onDTLSTransportError(
            new Error((event as RTCErrorEvent)?.error?.errorDetail) || 'DTLS Transport failed',
          );
        };
      }
    };
  }

  close() {
    super.close();
    this.channel.close();
  }

  initAfterJoin() {
    this.nativeConnection.onnegotiationneeded = async () => {
      HMSLogger.d(this.TAG, `onnegotiationneeded`);
      await this.observer.onRenegotiationNeeded();
    };
  }

  removeTrack(sender: RTCRtpSender) {
    console.log('remvoe track', this.nativeConnection.signalingState);
    if (this.nativeConnection.signalingState !== 'closed') {
      this.nativeConnection.removeTrack(sender);
    }
  }

  // eslint-disable-next-line
  async setMaxBitrateAndFramerate(
    track: HMSLocalTrack,
    updatedSettings?: HMSAudioTrackSettings | HMSVideoTrackSettings,
  ) {
    const maxBitrate = updatedSettings?.maxBitrate || track.settings.maxBitrate;
    const maxFramerate = track instanceof HMSLocalVideoTrack && track.settings.maxFramerate;
    const sender = track.transceiver?.sender;

    if (sender) {
      const params = sender.getParameters();
      // modify only for non-simulcast encodings
      if (params.encodings.length === 1) {
        if (maxBitrate) {
          params.encodings[0].maxBitrate = maxBitrate * 1000;
        }
        if (maxFramerate) {
          // @ts-ignore
          params.encodings[0].maxFramerate = maxFramerate;
        }
      }
      await sender.setParameters(params);
    } else {
      HMSLogger.w(
        this.TAG,
        `no sender found to setMaxBitrate for track - ${track.trackId}, sentTrackId - ${track.getTrackIDBeingSent()}`,
      );
    }
  }
}
