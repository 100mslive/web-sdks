import HMSMessage from '../../interfaces/message';
import { getMessageType, HMSMessageType } from './enums/HMSMessageType';

interface HMSMessageInit {
  sender: string;
  message: string;
  type: string;
  receiver?: string;
  time?: Date | string;
}

export default class Message implements HMSMessage {
  sender: string;
  receiver: string = '';
  message: string;
  time: Date;
  type: HMSMessageType;

  constructor({ sender, message, type, receiver, time }: HMSMessageInit) {
    this.sender = sender;
    this.message = message;
    this.type = getMessageType(type);
    if (receiver) {
      this.receiver = receiver;
    }
    // If time is available, creating Message object for a received message.
    if (time && time instanceof Date) {
      this.time = time;
    } else if (time && typeof time == 'string') {
      // If a received message has time as string(when using JSON.stringify), convert and store as Date object.
      this.time = new Date(time);
    } else {
      this.time = new Date();
    }
  }
}
