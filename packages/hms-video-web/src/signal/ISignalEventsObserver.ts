import { HMSTrickle } from '../connection/model';
import HMSException from '../error/HMSException';

export interface ISignalEventsObserver {
  onOffer(jsep: RTCSessionDescriptionInit): void;

  onTrickle(trickle: HMSTrickle): void;

  onNotification(message: Object): void;

  onServerError(error: HMSException): void;

  onFailure(exception: HMSException): void;

  onOffline(): void;

  onOnline(): void;
}
