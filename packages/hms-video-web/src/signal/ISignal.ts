import { HMSTrickle } from '../connection/model';
import { ISignalEventsObserver } from './ISignalEventsObserver';

export interface ISignal {
  readonly observer: ISignalEventsObserver;

  /** Open the connection to the give uri.
   * All the other methods (except [close]) requires a
   * proper connection. */
  open(uri: string): Promise<void>;

  /** Closes the connection to the `uri` passed in [open] */
  close(): Promise<void>;

  join(
    roomId: string,
    uid: string,
    offer: RTCSessionDescriptionInit,
    info: Object
  ): Promise<RTCSessionDescriptionInit>;

  offer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;

  answer(answer: RTCSessionDescriptionInit): void;

  trickle(trickle: HMSTrickle): void;
}
