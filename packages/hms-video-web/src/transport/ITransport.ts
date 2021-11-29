import { HMSLocalTrack } from '../media/tracks';
import { HMSVideoTrackSettings, HMSAudioTrackSettings } from '../media/settings';
import { HMSPeer, HMSRoleChangeRequest, RTMPRecordingConfig } from '../interfaces';
import { MultiTrackUpdateRequestParams, TrackUpdateRequestParams } from '../signal/interfaces';

// For AV track, we could get a normal track(true), empty track(empty) or no track at all(false)
export type IFetchTrackOptions = boolean | 'empty';
export interface IFetchAVTrackOptions {
  audio: IFetchTrackOptions;
  video: IFetchTrackOptions;
}

export type PeerConnectionType = 'publish' | 'subscribe';

export default interface ITransport {
  join(authToken: string, peerId: string, customData: any, initEndpoint?: string): Promise<void>;

  leave(): Promise<void>;

  publish(tracks: Array<HMSLocalTrack>): Promise<void>;

  unpublish(tracks: Array<HMSLocalTrack>): Promise<void>;

  getLocalScreen(
    videoSettings: HMSVideoTrackSettings,
    audioSettings: HMSAudioTrackSettings,
    onStop: () => void,
  ): Promise<Array<HMSLocalTrack>>;

  trackUpdate(track: HMSLocalTrack): void;

  changeRole(forPeer: HMSPeer, toRole: string, force: boolean): Promise<void>;

  acceptRoleChange(request: HMSRoleChangeRequest): Promise<void>;

  acceptRoleChange(request: HMSRoleChangeRequest): Promise<void>;

  removePeer(peerId: string, reason: string): Promise<void>;

  startRTMPOrRecording(params: RTMPRecordingConfig): Promise<void>;

  stopRTMPOrRecording(): Promise<void>;

  changeName(name: string): Promise<void>;

  changeMetadata(metadata: string): Promise<void>;

  changeTrackState(trackUpdateRequest: TrackUpdateRequestParams): Promise<void>;

  changeMultiTrackState(trackUpdateRequest: MultiTrackUpdateRequestParams): Promise<void>;
}
