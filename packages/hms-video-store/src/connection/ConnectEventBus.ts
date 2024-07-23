import { EventEmitter2 as EventEmitter } from 'eventemitter2';
import { HMSConnectionEvents, RTCIceCandidatePair } from './constants';
import { HMSInternalEvent } from '../events/HMSInternalEvent';
import { HMSTrack } from '../internal';

export class ConnectionEventBus {
  private eventEmitter: EventEmitter = new EventEmitter();
  readonly iceConnectionStateChange = new HMSInternalEvent<RTCIceConnectionState>(
    HMSConnectionEvents.ICE_CONNECTION_STATE_CHANGE,
    this.eventEmitter,
  );
  readonly connectionStateChange = new HMSInternalEvent<RTCPeerConnectionState>(
    HMSConnectionEvents.CONNECTION_STATE_CHANGE,
    this.eventEmitter,
  );
  readonly selectedCandidatePairChange = new HMSInternalEvent<RTCIceCandidatePair>(
    HMSConnectionEvents.SELECTED_CANDIDATE_PAIR_CHANGE,
    this.eventEmitter,
  );
  readonly iceCandidate = new HMSInternalEvent<RTCIceCandidate>(HMSConnectionEvents.ICE_CANDIDATE, this.eventEmitter);
  readonly dtlsStateChange = new HMSInternalEvent<RTCDtlsTransportState>(
    HMSConnectionEvents.DTLS_STATE_CHANGE,
    this.eventEmitter,
  );
  readonly dtlsError = new HMSInternalEvent<Error>(HMSConnectionEvents.DTLS_ERROR, this.eventEmitter);
  readonly renegotiationNeeded = new HMSInternalEvent<void>(
    HMSConnectionEvents.RENEGOTIATION_NEEDED,
    this.eventEmitter,
  );

  readonly trackAdd = new HMSInternalEvent<HMSTrack>(HMSConnectionEvents.ON_TRACK_ADD, this.eventEmitter);
  readonly trackRemove = new HMSInternalEvent<HMSTrack>(HMSConnectionEvents.ON_TRACK_REMOVE, this.eventEmitter);
  readonly apiChannelMessage = new HMSInternalEvent<string>(
    HMSConnectionEvents.ON_API_CHANNEL_MESSAGE,
    this.eventEmitter,
  );

  removeAllListeners = () => {
    this.eventEmitter.removeAllListeners();
  };
}
