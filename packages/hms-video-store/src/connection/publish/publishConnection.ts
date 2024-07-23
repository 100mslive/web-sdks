// import { IPublishConnectionObserver } from './IPublishConnectionObserver';
import JsonRpcSignal from '../../signal/jsonrpc';
import { API_DATA_CHANNEL } from '../../utils/constants';
import HMSLogger from '../../utils/logger';
import HMSConnection from '../HMSConnection';
import { HMSConnectionRole } from '../model';

export default class HMSPublishConnection extends HMSConnection {
  private readonly TAG = '[HMSPublishConnection]';
  // protected readonly observer: IPublishConnectionObserver;
  readonly nativeConnection: RTCPeerConnection;
  readonly channel: RTCDataChannel;

  constructor(signal: JsonRpcSignal, config: RTCConfiguration) {
    super(HMSConnectionRole.Publish, signal);

    this.nativeConnection = new RTCPeerConnection(config);
    this.channel = this.nativeConnection.createDataChannel(API_DATA_CHANNEL, {
      protocol: 'SCTP',
    });
    this.channel.onerror = ev => HMSLogger.e(this.TAG, `publish data channel onerror ${ev}`, ev);

    this.nativeConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.connectionEventBus.iceCandidate.publish(candidate);
        signal.trickle(this.role, candidate);
      }
    };

    this.nativeConnection.oniceconnectionstatechange = () => {
      this.connectionEventBus.iceConnectionStateChange.publish(this.nativeConnection.iceConnectionState);
    };

    this.nativeConnection.onconnectionstatechange = () => {
      this.connectionEventBus.connectionStateChange.publish(this.nativeConnection.connectionState);

      // this.observer.onConnectionStateChange(this.nativeConnection.connectionState);

      // here it replaces the original listener if already present and
      // handles cases where sctp transport is reinitialised
      if (this.nativeConnection.sctp) {
        this.nativeConnection.sctp.transport.onstatechange = () => {
          this.connectionEventBus.dtlsStateChange.publish(this.nativeConnection.sctp?.transport.state);
        };
        this.nativeConnection.sctp.transport.onerror = (event: Event) => {
          this.connectionEventBus.dtlsError.publish(
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
    this.nativeConnection.onnegotiationneeded = () => {
      HMSLogger.d(this.TAG, `onnegotiationneeded`);
      this.connectionEventBus.renegotiationNeeded.publish();
    };
  }
}
