import { HMSChangeMultiTrackStateParams } from './change-track-state';
import { HMSConfig, HMSPreviewConfig } from './config';
import { TokenRequest, TokenRequestOptions } from './get-token';
import { HLSConfig, StopHLSConfig } from './hls-config';
import { HMSLocalPeer, HMSPeer } from './peer';
import { HMSPeerListIteratorOptions } from './peer-list-iterator';
import { HMSPlaylistManager, HMSPlaylistSettings } from './playlist';
import { HMSPreviewListener } from './preview-listener';
import { HMSRole } from './role';
import { HMSRoleChangeRequest } from './role-change-request';
import { HMSHLS, HMSRecording, HMSRTMP, HMSTranscriptionInfo } from './room';
import { RTMPRecordingConfig } from './rtmp-recording-config';
import { HMSInteractivityCenter, HMSSessionStore } from './session-store';
import { HMSScreenShareConfig } from './track-settings';
import { TranscriptionConfig } from './transcription-config';
import { HMSAudioListener, HMSConnectionQualityListener, HMSUpdateListener } from './update-listener';
import { HMSAnalyticsLevel } from '../analytics/AnalyticsEventLevel';
import { IAudioOutputManager } from '../device-manager/AudioOutputManager';
import { HMSSessionFeedback } from '../end-call-feedback';
import { HMSRemoteTrack, HMSTrackSource } from '../media/tracks';
import { HMSWebrtcInternals } from '../rtc-stats/HMSWebrtcInternals';
import { HMSPeerListIterator } from '../sdk/HMSPeerListIterator';
import { BroadcastResponse } from '../signal/interfaces';
import { HMSLogLevel } from '../utils/logger';

export interface HMSInterface {
  preview(config: HMSPreviewConfig, listener: HMSPreviewListener): Promise<void>;
  join(config: HMSConfig, listener: HMSUpdateListener): Promise<void>;
  leave(notifyServer?: boolean): Promise<void>;
  cancelMidCallPreview(): Promise<void>;

  getAuthTokenByRoomCode(tokenRequest: TokenRequest, tokenRequestOptions?: TokenRequestOptions): Promise<string>;

  getLocalPeer(): HMSLocalPeer | undefined;
  getPeers(): HMSPeer[];
  getRoles(): HMSRole[];
  getAudioOutput(): IAudioOutputManager;
  getSessionStore(): HMSSessionStore;
  getInteractivityCenter(): HMSInteractivityCenter;
  getPlaylistManager(): HMSPlaylistManager;
  getWebrtcInternals(): HMSWebrtcInternals | undefined;
  refreshDevices(): Promise<void>;

  /**
   * @deprecated Use `changeRoleOfPeer` instead
   */
  changeRole(forPeerId: string, toRole: string, force?: boolean): void;

  changeRoleOfPeer(forPeerId: string, toRole: string, force?: boolean): void;

  changeRoleOfPeersWithRoles(roles: HMSRole[], toRole: string): void;

  acceptChangeRole(request: HMSRoleChangeRequest): void;

  changeTrackState(forRemoteTrack: HMSRemoteTrack, enabled: boolean): Promise<void>;
  changeMultiTrackState(params: HMSChangeMultiTrackStateParams): Promise<void>;
  removePeer(peerId: string, reason: string): Promise<void>;
  endRoom(lock: boolean, reason: string): Promise<void>;
  startRTMPOrRecording(params: RTMPRecordingConfig): Promise<void>;
  stopRTMPAndRecording(): Promise<void>;
  /**
   * @param {HLSConfig} params
   */
  startHLSStreaming(params?: HLSConfig): Promise<void>;
  stopHLSStreaming(params?: StopHLSConfig): Promise<void>;
  startTranscription(params: TranscriptionConfig): Promise<void>;
  stopTranscription(params: TranscriptionConfig): Promise<void>;
  getRecordingState(): HMSRecording | undefined;
  getRTMPState(): HMSRTMP | undefined;
  getHLSState(): HMSHLS | undefined;
  getTranscriptionState(): HMSTranscriptionInfo[] | undefined;
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
  sendMessage(type: string, message: string): BroadcastResponse | void;
  sendBroadcastMessage(message: string, type?: string): Promise<BroadcastResponse>;
  sendGroupMessage(message: string, roles: HMSRole[], type?: string): Promise<BroadcastResponse>;
  sendDirectMessage(message: string, peerId: string, type?: string): Promise<BroadcastResponse>;

  startScreenShare(onStop: () => void, config?: HMSScreenShareConfig): Promise<void>;
  stopScreenShare(): Promise<void>;

  addTrack(track: MediaStreamTrack, source: HMSTrackSource): Promise<void>;
  removeTrack(trackId: string): Promise<void>;

  setLogLevel(level: HMSLogLevel): void;
  setAnalyticsLevel(level: HMSAnalyticsLevel): void;
  addAudioListener(listener: HMSAudioListener): void;
  addConnectionQualityListener(qualityListener: HMSConnectionQualityListener): void;

  raiseLocalPeerHand(): Promise<void>;
  lowerLocalPeerHand(): Promise<void>;
  raiseRemotePeerHand(peerId: string): Promise<void>;
  lowerRemotePeerHand(peerId: string): Promise<void>;

  getPeerListIterator(options?: HMSPeerListIteratorOptions): HMSPeerListIterator;

  updatePlaylistSettings(options: HMSPlaylistSettings): void;
  submitSessionFeedback(feedback: HMSSessionFeedback, eventEndpoint?: string): Promise<void>;
}
