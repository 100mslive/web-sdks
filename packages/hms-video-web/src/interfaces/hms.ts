import { HMSConfig } from './config';
import HMSUpdateListener, { HMSAudioListener } from './update-listener';
import { HMSMessage, HMSMessageInput } from './message';
import { HMSLogLevel } from '../utils/logger';
import { HMSAnalyticsLevel } from '../analytics/AnalyticsEventLevel';
import { HMSRemoteTrack, HMSTrackSource } from '../media/tracks';
import { HMSLocalPeer, HMSPeer, HMSRemotePeer } from './peer';
import { HMSRole } from './role';
import { HMSPreviewListener } from './preview-listener';
import { IAudioOutputManager } from '../device-manager/AudioOutputManager';
import { HMSRoleChangeRequest } from './role-change-request';

export default interface HMS {
  preview(config: HMSConfig, listener: HMSPreviewListener): void;
  join(config: HMSConfig, listener: HMSUpdateListener): void;
  leave(): Promise<void>;

  getLocalPeer(): HMSLocalPeer | undefined;
  getPeers(): HMSPeer[];
  getRoles(): HMSRole[];
  getAudioOutput(): IAudioOutputManager;

  changeRole(forPeer: HMSRemotePeer, toRole: string, force?: boolean): void;
  acceptChangeRole(request: HMSRoleChangeRequest): void;

  changeTrackState(forRemoteTrack: HMSRemoteTrack, enabled: boolean): void;

  endRoom(lock: boolean, reason: string): void;

  sendMessage(message: string | HMSMessageInput): HMSMessage | void;
  startScreenShare(onStop: () => void): Promise<void>;
  stopScreenShare(): Promise<void>;

  addTrack(track: MediaStreamTrack, source: HMSTrackSource): Promise<void>;
  removeTrack(trackId: string): Promise<void>;

  setLogLevel(level: HMSLogLevel): void;
  setAnalyticsLevel(level: HMSAnalyticsLevel): void;
  addAudioListener(listener: HMSAudioListener): void;
}
