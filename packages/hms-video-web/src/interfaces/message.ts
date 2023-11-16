import { HMSRole } from './role';
import { HMSPeer } from '../sdk/models/peer';

export interface HMSMessageInput {
  recipientPeer?: HMSPeer;
  recipientRoles?: HMSRole[];
  type?: string;
  message: string;
  quotedMessage?: HMSQuotedMessage;
}
export interface HMSQuotedMessage {
  senderName?: string;
  sender?: string;
  time: Date;
  type?: string;
  message: any;
  id?: string;
}

export interface HMSMessage {
  sender?: HMSPeer;
  recipientPeer?: HMSPeer;
  recipientRoles?: HMSRole[];
  time: Date;
  type?: string;
  message: any;
  id?: string;
  quotedMessage?: HMSQuotedMessage;
}
