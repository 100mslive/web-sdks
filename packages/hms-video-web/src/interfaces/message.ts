import { HMSPeer } from '../sdk/models/peer';
import { HMSRole } from './role';

export interface HMSMessageInput {
  recipientPeers?: HMSPeer[];
  recipientRoles?: HMSRole[];
  type?: string;
  message: string;
}
export interface HMSMessage {
  sender: HMSPeer;
  recipientPeers?: HMSPeer[];
  recipientRoles?: HMSRole[];
  time: Date;
  type?: string;
  message: any;
}
