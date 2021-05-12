import HMSConfig from './config';
import HMSUpdateListener from './update-listener';
import HMSPeer from './hms-peer';
import HMSMessage from './message';
import { HMSLogLevel } from '../utils/logger';

export enum HMSAnalyticsLevel {
  OFF,
  ERROR,
  INFO,
  VERBOSE,
}

export default interface HMS {
  logLevel: HMSLogLevel;
  analyticsLevel: HMSAnalyticsLevel;
  join(config: HMSConfig, callback: HMSUpdateListener): void;
  leave(): void;
  getLocalPeer(): HMSPeer;
  getPeers(): HMSPeer[];
  sendMessage(type: string, message: string, receiver?: string): HMSMessage;
  startScreenShare(onStop: () => void): void;
  stopScreenShare(): void;
}
