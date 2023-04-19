import { HMSChangeMultiTrackStateParams } from './change-track-state';
import { HMSConfig, HMSPreviewConfig } from './config';
import { TokenRequest, TokenRequestOptions } from './get-token';
import { HLSConfig } from './hls-config';
import { HMSMessage } from './message';
import { HMSLocalPeer, HMSPeer, HMSRemotePeer } from './peer';
import { HMSPlaylistManager } from './playlist';
import { HMSPreviewListener } from './preview-listener';
import { HMSRole } from './role';
import { HMSRoleChangeRequest } from './role-change-request';
import { HMSHLS, HMSRecording, HMSRTMP } from './room';
import { RTMPRecordingConfig } from './rtmp-recording-config';
import { HMSSessionStore } from './session-store';
import { HMSScreenShareConfig } from './track-settings';
import { HMSAudioListener, HMSConnectionQualityListener, HMSUpdateListener } from './update-listener';
import { HMSAnalyticsLevel } from '../analytics/AnalyticsEventLevel';
import { IAudioOutputManager } from '../device-manager/AudioOutputManager';
import { HMSRemoteTrack, HMSTrackSource } from '../media/tracks';
import { HMSWebrtcInternals } from '../rtc-stats/HMSWebrtcInternals';
import { HMSLogLevel } from '../utils/logger';

export default interface HMS {
  preview(config: HMSPreviewConfig, listener: HMSPreviewListener): Promise<void>;
  join(config: HMSConfig, listener: HMSUpdateListener): Promise<void>;
  leave(notifyServer?: boolean): Promise<void>;

  getAuthTokenByRoomCode(tokenRequest: TokenRequest, tokenRequestOptions?: TokenRequestOptions): Promise<string>;

  getLocalPeer(): HMSLocalPeer | undefined;
  getPeers(): HMSPeer[];
  getRoles(): HMSRole[];
  getAudioOutput(): IAudioOutputManager;
  getSessionStore(): HMSSessionStore;
  getPlaylistManager(): HMSPlaylistManager;
  getWebrtcInternals(): HMSWebrtcInternals | undefined;
  refreshDevices(): Promise<void>;

  /**
   * @deprecated Use `changeRoleOfPeer` instead
   */
  changeRole(forPeer: HMSPeer, toRole: string, force?: boolean): void;

  changeRoleOfPeer(forPeer: HMSPeer, toRole: string, force?: boolean): void;

  changeRoleOfPeersWithRoles(roles: HMSRole[], toRole: string): void;

  acceptChangeRole(request: HMSRoleChangeRequest): void;

  changeTrackState(forRemoteTrack: HMSRemoteTrack, enabled: boolean): Promise<void>;
  changeMultiTrackState(params: HMSChangeMultiTrackStateParams): Promise<void>;
  removePeer(peer: HMSRemotePeer, reason: string): Promise<void>;
  endRoom(lock: boolean, reason: string): Promise<void>;
  startRTMPOrRecording(params: RTMPRecordingConfig): Promise<void>;
  stopRTMPAndRecording(): Promise<void>;
  /**
   * @param {HLSConfig} params
   */
  startHLSStreaming(params?: HLSConfig): Promise<void>;
  stopHLSStreaming(params?: HLSConfig): Promise<void>;
  getRecordingState(): HMSRecording | undefined;
  getRTMPState(): HMSRTMP | undefined;
  getHLSState(): HMSHLS | undefined;
  changeName(name: string): Promise<void>;
  changeMetadata(metadata: string): Promise<void>;

  /** @deprecated Use `getSessionStore().set` instead */
  setSessionMetadata(metadata: any): Promise<void>;
  /** @deprecated Use `getSessionStore().observe` instead */
  getSessionMetadata(): Promise<any>;

  /**
   * @deprecated The method should not be used
   * @see sendBroadcastMessage
   */
  sendMessage(type: string, message: string): HMSMessage | void;
  sendBroadcastMessage(message: string, type?: string): Promise<HMSMessage>;
  sendGroupMessage(message: string, roles: HMSRole[], type?: string): Promise<HMSMessage>;
  sendDirectMessage(message: string, peer: HMSPeer, type?: string): Promise<HMSMessage>;

  startScreenShare(onStop: () => void, config?: HMSScreenShareConfig): Promise<void>;
  stopScreenShare(): Promise<void>;

  addTrack(track: MediaStreamTrack, source: HMSTrackSource): Promise<void>;
  removeTrack(trackId: string): Promise<void>;

  setLogLevel(level: HMSLogLevel): void;
  setAnalyticsLevel(level: HMSAnalyticsLevel): void;
  addAudioListener(listener: HMSAudioListener): void;
  addConnectionQualityListener(qualityListener: HMSConnectionQualityListener): void;
}
