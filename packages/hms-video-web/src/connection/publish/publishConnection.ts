import HMSConnection from '../index';
import { ISignal } from '../../signal/ISignal';
import { IPublishConnectionObserver } from './IPublishConnectionObserver';
import { HMSConnectionRole } from '../model';
import { API_DATA_CHANNEL } from '../../utils/constants';
import HMSLogger from '../../utils/logger';
import HMSTransport from '../../transport';
import { HMSLocalTrack } from '../../media/tracks';

const TAG = 'HMSPublishConnection';

export default class HMSPublishConnection extends HMSConnection {
  private readonly observer: IPublishConnectionObserver;
  readonly nativeConnection: RTCPeerConnection;
  private readonly transport: HMSTransport;

  constructor(
    signal: ISignal,
    config: RTCConfiguration,
    observer: IPublishConnectionObserver,
    transport: HMSTransport,
  ) {
    super(HMSConnectionRole.Publish, signal);
    this.observer = observer;
    this.transport = transport;

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
    };
  }

  initAfterJoin() {
    this.nativeConnection.onnegotiationneeded = async () => {
      HMSLogger.d(TAG, `onnegotiationneeded`);
      await this.observer.onRenegotiationNeeded();
    };
  }

  trackUpdate(track: HMSLocalTrack) {
    this.transport.trackUpdate(track);
  }
}
