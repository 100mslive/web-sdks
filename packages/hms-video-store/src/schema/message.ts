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
}

/**
 * @internal
 */
export interface HMSMessageInput {
  recipientPeer?: HMSPeerID;
  recipientRoles?: HMSRoleName[];
  type?: string;
  message: any;
  id: string;
  time: number;
}
