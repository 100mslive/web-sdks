import { HMSPeer } from '../sdk/models/peer';
import { HMSRole } from './role';

export interface HMSMessageInput {
  recipientPeer?: HMSPeer;
  recipientRoles?: HMSRole[];
  type?: string;
  message: string;
}
export interface HMSMessage {
  sender: HMSPeer;
  recipientPeer?: HMSPeer;
  recipientRoles?: HMSRole[];
  time: Date;
  type?: string;
  message: any;
}
