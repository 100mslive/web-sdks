import HMSConfig from './config';
import HMSUpdateListener from './update-listener';
import HMSPeer from './hms-peer';
import HMSMessage from './message';
import { HMSLogLevel } from '../utils/logger';
import { HMSAnalyticsLevel } from '../analytics/AnalyticsEventLevel';
import { HMSTrackSource } from '../media/tracks';

export default interface HMS {
  join(config: HMSConfig, callback: HMSUpdateListener): void;
  leave(): Promise<void>;
  getLocalPeer(): HMSPeer;
  getPeers(): HMSPeer[];
  sendMessage(type: string, message: string, receiver?: string): HMSMessage;
  startScreenShare(onStop: () => void): Promise<void>;
  stopScreenShare(): Promise<void>;
  addTrack(track: MediaStreamTrack, source: HMSTrackSource): Promise<void>;
  removeTrack(trackId: string): Promise<void>;

  setLogLevel(level: HMSLogLevel): void;
  setAnalyticsLevel(level: HMSAnalyticsLevel): void;
}
