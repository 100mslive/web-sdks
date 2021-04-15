import HMSConfig from './config';
import HMSUpdateListener from './update-listener';
import HMSPeer from './hms-peer';
import HMSMessage, { HMSMessageListener } from './message';

export enum HMSlogLevel {
  OFF,
  ERROR,
  WARN,
  INFO,
  VERBOSE, // @Discuss DEBUG is most commonly used
}

export enum HMSAnalyticsLevel {
  OFF,
  ERROR,
  INFO,
  VERBOSE,
}

export default interface HMS {
  logLevel: HMSlogLevel;
  analyticsLevel: HMSAnalyticsLevel;
  join(config: HMSConfig, callback: HMSUpdateListener): void;
  leave(): void;
  getLocalPeer(): HMSPeer;
  getPeers(): HMSPeer[];
  sendMessage(message: HMSMessage): void;
  onMessageReceived(callback: HMSMessageListener): void;
  startScreenShare(): void;
  stopScreenShare(): void;
}
