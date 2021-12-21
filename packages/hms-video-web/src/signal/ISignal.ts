import { IAnalyticsTransportProvider } from '../analytics/IAnalyticsTransportProvider';
import { HMSConnectionRole } from '../connection/model';
import { HMSMessage } from '../interfaces';
import {
  Track,
  AcceptRoleChangeParams,
  RequestForRoleChangeParams,
  TrackUpdateRequestParams,
  RemovePeerRequest,
  MultiTrackUpdateRequestParams,
  StartRTMPOrRecordingRequestParams,
  UpdatePeerRequestParams,
  HLSRequestParams,
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

  leave(): void;

  endRoom(lock: boolean, reason: string): Promise<void>;

  ping(timeout: number): Promise<number>;

  requestRoleChange(params: RequestForRoleChangeParams): Promise<void>;

  acceptRoleChangeRequest(params: AcceptRoleChangeParams): Promise<void>;

  requestTrackStateChange(params: TrackUpdateRequestParams): Promise<void>;

  requestMultiTrackStateChange(params: MultiTrackUpdateRequestParams): Promise<void>;

  removePeer(params: RemovePeerRequest): Promise<void>;

  startRTMPOrRecording(params: StartRTMPOrRecordingRequestParams): Promise<void>;

  stopRTMPAndRecording(): Promise<void>;

  startHLSStreaming(params: HLSRequestParams): Promise<void>;

  stopHLSStreaming(params?: HLSRequestParams): Promise<void>;

  updatePeer(params: UpdatePeerRequestParams): Promise<void>;

  close(): Promise<void>;
}
