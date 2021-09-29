import { HMSConfig } from './config';
import { HMSAudioListener, HMSUpdateListener } from './update-listener';
import { HMSMessage } from './message';
import { HMSLogLevel } from '../utils/logger';
import { HMSAnalyticsLevel } from '../analytics/AnalyticsEventLevel';
import { HMSRemoteTrack, HMSTrackSource } from '../media/tracks';
import { HMSLocalPeer, HMSPeer, HMSRemotePeer } from './peer';
import { HMSRole } from './role';
import { HMSPreviewListener } from './preview-listener';
import { IAudioOutputManager } from '../device-manager/AudioOutputManager';
import { HMSRoleChangeRequest } from './role-change-request';
import { HMSPlaylistManager } from './playlist';
import { RTMPRecordingConfig } from './rtmp-recording-config';
import { HMSRecording, HMSRTMP } from './room';

export default interface HMS {
  preview(config: HMSConfig, listener: HMSPreviewListener): void;
  join(config: HMSConfig, listener: HMSUpdateListener): void;
  leave(): Promise<void>;

  getLocalPeer(): HMSLocalPeer | undefined;
  getPeers(): HMSPeer[];
  getRoles(): HMSRole[];
  getAudioOutput(): IAudioOutputManager;
  getPlaylistManager(): HMSPlaylistManager;

  changeRole(forPeer: HMSPeer, toRole: string, force?: boolean): void;
  acceptChangeRole(request: HMSRoleChangeRequest): void;

  changeTrackState(forRemoteTrack: HMSRemoteTrack, enabled: boolean): Promise<void>;
  removePeer(peer: HMSRemotePeer, reason: string): Promise<void>;
  endRoom(lock: boolean, reason: string): Promise<void>;
  startRTMPOrRecording(params: RTMPRecordingConfig): Promise<void>;
  stopRTMPAndRecording(): Promise<void>;
  getRecordingState(): HMSRecording | undefined;
  getRTMPState(): HMSRTMP | undefined;

  /**
   * @deprecated The method should not be used
   * @see sendBroadcastMessage
   */
  sendMessage(type: string, message: string): HMSMessage | void;
  sendBroadcastMessage(message: string, type?: string): Promise<HMSMessage>;
  sendGroupMessage(message: string, roles: HMSRole[], type?: string): Promise<HMSMessage>;
  sendDirectMessage(message: string, peer: HMSPeer, type?: string): Promise<HMSMessage>;

  startScreenShare(onStop: () => void, audioOnly: boolean): Promise<void>;
  stopScreenShare(): Promise<void>;

  addTrack(track: MediaStreamTrack, source: HMSTrackSource): Promise<void>;
  removeTrack(trackId: string): Promise<void>;

  setLogLevel(level: HMSLogLevel): void;
  setAnalyticsLevel(level: HMSAnalyticsLevel): void;
  addAudioListener(listener: HMSAudioListener): void;
}
