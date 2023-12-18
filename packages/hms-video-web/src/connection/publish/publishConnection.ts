import { IPublishConnectionObserver } from './IPublishConnectionObserver';
import { ISignal } from '../../signal/ISignal';
import { API_DATA_CHANNEL } from '../../utils/constants';
import HMSLogger from '../../utils/logger';
import HMSConnection from '../HMSConnection';
import { HMSConnectionRole } from '../model';

export default class HMSPublishConnection extends HMSConnection {
  private readonly TAG = '[HMSPublishConnection]';
  private readonly observer: IPublishConnectionObserver;
  readonly nativeConnection: RTCPeerConnection;

  constructor(signal: ISignal, config: RTCConfiguration, observer: IPublishConnectionObserver) {
    super(HMSConnectionRole.Publish, signal);
    this.observer = observer;

    this.nativeConnection = new RTCPeerConnection(config);
    this.nativeConnection.createDataChannel(API_DATA_CHANNEL, {
      protocol: 'SCTP',
    });

    this.nativeConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        signal.trickle(this.role, candidate);
      }
    };

    this.nativeConnection.oniceconnectionstatechange = () => {
      this.observer.onIceConnectionChange(this.nativeConnection.iceConnectionState);
    };

    // @TODO(eswar): Remove this. Use iceconnectionstate change with interval and threshold.
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

  initAfterJoin() {
    this.nativeConnection.onnegotiationneeded = async () => {
      HMSLogger.d(this.TAG, `onnegotiationneeded`);
      await this.observer.onRenegotiationNeeded();
    };
  }
}
