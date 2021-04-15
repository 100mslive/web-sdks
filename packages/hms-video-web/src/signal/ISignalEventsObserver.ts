import { HMSTrickle } from '../connection/model';
import HMSException from '../error/HMSException';

export interface ISignalEventsObserver {
  onOffer(jsep: RTCSessionDescriptionInit): void;

  onTrickle(trickle: HMSTrickle): void;

  onNotification(message: Object): void;

  onFailure(exception: HMSException): void;
}
