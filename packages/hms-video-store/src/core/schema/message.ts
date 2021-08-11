import { HMSPeerID } from './peer';
import { HMSRoleName } from './role';

export type HMSMessageID = string;

export enum HMSMessageType {
  CHAT = 'chat',
}

export interface HMSMessage {
  id: HMSMessageID;
  sender: HMSPeerID;
  senderName: string;
  senderUserId?: string;
  senderRole?: string;
  recipientPeers?: HMSPeerID[];
  recipientRoles?: HMSRoleName[];
  time: Date;
  read: boolean;
  type: string;
  message: any;
}

export interface HMSMessageInput {
  recipientPeers?: HMSPeerID[];
  recipientRoles?: HMSRoleName[];
  type?: string;
  message: any;
}
