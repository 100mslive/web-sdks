import { IAnalyticsTransportProvider } from '../analytics/IAnalyticsTransportProvider';
import { HMSConnectionRole } from '../connection/model';
import { HMSMessage } from '../interfaces';
import {
  Track,
  AcceptRoleChangeParams,
  RequestForRoleChangeParams,
  TrackUpdateRequestParams,
  RemovePeerRequest,
} from './interfaces';

export interface ISignal extends IAnalyticsTransportProvider {
  isConnected: boolean;

  open(uri: string): Promise<void>;

  join(
    name: string,
    data: string,
    offer: RTCSessionDescriptionInit,
    disableVidAutoSub: boolean,
  ): Promise<RTCSessionDescriptionInit>;

  trickle(target: HMSConnectionRole, candidate: RTCIceCandidateInit): void;

  offer(desc: RTCSessionDescriptionInit, tracks: Map<string, Track>): Promise<RTCSessionDescriptionInit>;

  answer(desc: RTCSessionDescriptionInit): void;

  trackUpdate(tracks: Map<string, Track>): void;

  broadcast(message: HMSMessage): Promise<void>;

  recordStart(): void;

  recordEnd(): void;

  leave(): void;

  endRoom(lock: boolean, reason: string): Promise<void>;

  ping(timeout: number): Promise<number>;

  requestRoleChange(params: RequestForRoleChangeParams): Promise<void>;

  acceptRoleChangeRequest(params: AcceptRoleChangeParams): Promise<void>;

  requestTrackStateChange(params: TrackUpdateRequestParams): Promise<void>;

  removePeer(params: RemovePeerRequest): Promise<void>;

  close(): Promise<void>;
}
