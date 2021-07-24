import { HMSConfig } from './config';
import HMSUpdateListener from './update-listener';
import { HMSMessage } from './message';
import { HMSLogLevel } from '../utils/logger';
import { HMSAnalyticsLevel } from '../analytics/AnalyticsEventLevel';
import { HMSTrackSource } from '../media/tracks';
import { HMSLocalPeer, HMSPeer } from '../sdk/models/peer';
import { HMSRole } from './role';

export default interface HMS {
  join(config: HMSConfig, callback: HMSUpdateListener): void;
  leave(): Promise<void>;
  getLocalPeer(): HMSLocalPeer | undefined;
  getPeers(): HMSPeer[];
  sendMessage(type: string, message: string, receiver?: string): HMSMessage;
  startScreenShare(onStop: () => void): Promise<void>;
  stopScreenShare(): Promise<void>;
  addTrack(track: MediaStreamTrack, source: HMSTrackSource): Promise<void>;
  removeTrack(trackId: string): Promise<void>;

  setLogLevel(level: HMSLogLevel): void;
  setAnalyticsLevel(level: HMSAnalyticsLevel): void;
  getRoles(): HMSRole[];
}
