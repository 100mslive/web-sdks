import HMSConnection from '../index';
import { ISignal } from '../../signal/ISignal';
import { IPublishConnectionObserver } from './IPublishConnectionObserver';
import { HMSConnectionRole } from '../model';
import { API_DATA_CHANNEL } from '../../utils/constants';
import HMSLogger from '../../utils/logger';

const TAG = 'HMSPublishConnection';

export default class HMSPublishConnection extends HMSConnection {
  private readonly observer: IPublishConnectionObserver;
  readonly nativeConnection: RTCPeerConnection;

  constructor(signal: ISignal, config: RTCConfiguration, observer: IPublishConnectionObserver) {
    super(HMSConnectionRole.PUBLISH, signal);
    this.observer = observer;

    this.nativeConnection = new RTCPeerConnection(config);
    this.nativeConnection.createDataChannel(API_DATA_CHANNEL, {
      protocol: 'SCTP',
    });

    this.nativeConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        signal.trickle({ target: this.role, candidate });
      }
    };

    this.nativeConnection.oniceconnectionstatechange = () => {
      this.observer.onIceConnectionChange(this.nativeConnection.iceConnectionState);
    };
  }

  initAfterJoin() {
    this.nativeConnection.onnegotiationneeded = async () => {
      HMSLogger.d(TAG, `onnegotiationneeded`);
      await this.observer.onRenegotiationNeeded();
    };
  }
}
