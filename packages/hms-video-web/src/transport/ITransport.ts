import {
  HLSConfig,
  HLSTimedMetadata,
  HMSPeer,
  HMSRole,
  HMSRoleChangeRequest,
  RTMPRecordingConfig,
} from '../interfaces';
import { HMSLocalTrack } from '../media/tracks';
import {
  GetSessionMetadataResponse,
  MultiTrackUpdateRequestParams,
  SetSessionMetadataParams,
  SetSessionMetadataResponse,
  TrackUpdateRequestParams,
} from '../signal/interfaces';

// For AV track, we could get a normal track(true), empty track(empty) or no track at all(false)
export type IFetchTrackOptions = boolean | 'empty';
export interface IFetchAVTrackOptions {
  audio: IFetchTrackOptions;
  video: IFetchTrackOptions;
}

export default interface ITransport {
  join(authToken: string, peerId: string, customData: any, initEndpoint?: string): Promise<void>;

  leave(notifyServer: boolean): Promise<void>;

  publish(tracks: Array<HMSLocalTrack>): Promise<void>;

  unpublish(tracks: Array<HMSLocalTrack>): Promise<void>;

  trackUpdate(track: HMSLocalTrack): void;

  /**
   * @deprecated Use `changeRoleOfPeer`
   */
  changeRole(forPeer: HMSPeer, toRole: string, force: boolean): Promise<void>;

  changeRoleOfPeer(forPeer: HMSPeer, toRole: string, force: boolean): Promise<void>;

  acceptRoleChange(request: HMSRoleChangeRequest): Promise<void>;

  removePeer(peerId: string, reason: string): Promise<void>;

  startRTMPOrRecording(params: RTMPRecordingConfig): Promise<void>;

  stopRTMPOrRecording(): Promise<void>;

  startHLSStreaming(params: HLSConfig): Promise<void>;

  stopHLSStreaming(params?: HLSConfig): Promise<void>;
  sendHLSTimedMetadata(metadataList: HLSTimedMetadata[]): Promise<void>;

  changeName(name: string): Promise<void>;

  changeMetadata(metadata: string): Promise<void>;

  getSessionMetadata(key?: string): Promise<GetSessionMetadataResponse>;

  setSessionMetadata(params: SetSessionMetadataParams): Promise<SetSessionMetadataResponse>;

  listenMetadataChange(keys: string[]): Promise<void>;

  changeTrackState(trackUpdateRequest: TrackUpdateRequestParams): Promise<void>;

  changeMultiTrackState(trackUpdateRequest: MultiTrackUpdateRequestParams): Promise<void>;

  handleLocalRoleUpdate({ oldRole, newRole }: { oldRole: HMSRole; newRole: HMSRole }): Promise<void>;
}
