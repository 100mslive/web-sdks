import { HMSPeerID } from './peer';
import { HMSRoleName } from './role';

export type HMSMessageID = string;

/**
 * @internal
 */
export enum HMSMessageType {
  CHAT = 'chat',
}

export interface HMSMessage {
  id: HMSMessageID;
  sender?: HMSPeerID;
  senderName?: string;
  senderUserId?: string;
  senderRole?: string;
  recipientPeer?: HMSPeerID;
  recipientRoles?: HMSRoleName[];
  time: Date;
  read: boolean;
  type: string;
  message: any;
  /**
   * true if message will not be put it in store because it has been ignored
   */
  ignored: boolean;
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

/**
 * @internal
 */
export interface HMSMessageInput {
  recipientPeer?: HMSPeerID;
  recipientRoles?: HMSRoleName[];
  type?: string;
  message: any;
  quotedMessage?: HMSQuotedMessage;
}
