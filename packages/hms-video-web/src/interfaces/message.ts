import { HMSRole } from './role';
import { HMSPeer } from '../sdk/models/peer';

export interface HMSMessageInput {
  recipientPeer?: HMSPeer;
  recipientRoles?: HMSRole[];
  type?: string;
  message: string;
  quotedMessageID?: string;
}

export interface HMSMessage {
  sender?: HMSPeer;
  recipientPeer?: HMSPeer;
  recipientRoles?: HMSRole[];
  time: Date;
  type?: string;
  message: any;
  id?: string;
  quotedMessageID?: string;
}
