export enum HMSMessageType {
  CHAT,
}

export default interface HMSMessage {
  sender: string;
  receiver: string;
  time: Date;
  type: HMSMessageType;
  mesage: string;
}

export interface HMSMessageListener {
  onMessage(type: HMSMessageType, message: HMSMessage): void;
}
