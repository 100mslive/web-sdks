import {
  AcceptRoleChangeParams,
  BroadcastResponse,
  GetSessionMetadataResponse,
  HLSRequestParams,
  HLSTimedMetadataParams,
  MultiTrackUpdateRequestParams,
  RemovePeerRequest,
  RequestForBulkRoleChangeParams,
  RequestForRoleChangeParams,
  SetSessionMetadataParams,
  SetSessionMetadataResponse,
  StartRTMPOrRecordingRequestParams,
  Track,
  TrackUpdateRequestParams,
  UpdatePeerRequestParams,
} from './interfaces';
import { IAnalyticsTransportProvider } from '../analytics/IAnalyticsTransportProvider';
import { HMSConnectionRole } from '../connection/model';
import { HMSMessage } from '../interfaces';

export interface ISignal extends IAnalyticsTransportProvider {
  isConnected: boolean;

  getPongResponseTimes: () => number[];

  open(uri: string): Promise<void>;

  join(
    name: string,
    data: string,
    disableVidAutoSub: boolean,
    serverSubDegrade: boolean,
    simulcast: boolean,
    offer?: RTCSessionDescriptionInit,
  ): Promise<RTCSessionDescriptionInit>;

  trickle(target: HMSConnectionRole, candidate: RTCIceCandidateInit): void;

  offer(desc: RTCSessionDescriptionInit, tracks: Map<string, Track>): Promise<RTCSessionDescriptionInit>;

  answer(desc: RTCSessionDescriptionInit): void;

  trackUpdate(tracks: Map<string, Track>): void;

  broadcast(message: HMSMessage): Promise<BroadcastResponse>;

  leave(): void;

  endRoom(lock: boolean, reason: string): Promise<void>;

  ping(timeout: number): Promise<number>;

  requestRoleChange(params: RequestForRoleChangeParams): Promise<void>;

  requestBulkRoleChange(params: RequestForBulkRoleChangeParams): Promise<void>;

  acceptRoleChangeRequest(params: AcceptRoleChangeParams): Promise<void>;

  requestTrackStateChange(params: TrackUpdateRequestParams): Promise<void>;

  requestMultiTrackStateChange(params: MultiTrackUpdateRequestParams): Promise<void>;

  removePeer(params: RemovePeerRequest): Promise<void>;

  startRTMPOrRecording(params: StartRTMPOrRecordingRequestParams): Promise<void>;

  stopRTMPAndRecording(): Promise<void>;

  startHLSStreaming(params: HLSRequestParams): Promise<void>;

  stopHLSStreaming(params?: HLSRequestParams): Promise<void>;

  sendHLSTimedMetadata(params?: HLSTimedMetadataParams): Promise<void>;

  updatePeer(params: UpdatePeerRequestParams): Promise<void>;

  getSessionMetadata(key?: string): Promise<GetSessionMetadataResponse>;

  setSessionMetadata(params: SetSessionMetadataParams): Promise<SetSessionMetadataResponse>;

  listenMetadataChange(keys: string[]): Promise<void>;

  close(): Promise<void>;
}
