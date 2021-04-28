import { HMSMessageType } from '../sdk/models/enums/HMSMessageType';

export default interface HMSMessage {
  sender: string;
  receiver?: string;
  time: Date;
  type: HMSMessageType;
  message: string;
}

export interface HMSMessageListener {
  onMessage(type: HMSMessageType, message: HMSMessage): void;
}
