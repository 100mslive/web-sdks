import { HMSPeerID } from './peer';

export type HMSMessageID = string;

export enum HMSMessageType {
  CHAT = 'chat',
}

export interface HMSMessage {
  id: HMSMessageID;
  sender: HMSPeerID;
  senderName?: string; // recorded at the time of message received
  time: Date;
  read: boolean;
  type: HMSMessageType;
  message: string;
}
