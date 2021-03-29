import HMSConfig from './config';
import HMSUpdateListener from './update-listener';
import HMSPeer from './peer';
import HMSMessage, { HMSMessageListener } from './message';
import HMSDevice from './device';

export default interface HMS {
  join(config: HMSConfig, callback: HMSUpdateListener): void;
  leave(): void;
  getLocalPeer(): HMSPeer;
  getPeers(): HMSPeer[];
  sendMessage(message: HMSMessage): void;
  onMessageReceived(callback: HMSMessageListener): void;
  startScreenShare(): void;
  stopScreenShare(): void;
}

export interface HMSutils {
  getDevices(): HMSDevice[];
}
