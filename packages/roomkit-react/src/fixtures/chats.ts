import { HMSMessage, HMSMessageType } from '@100mslive/hms-video-store';

let counter = 1;
export const makeFakeMessage = (msg: string, sender: string): HMSMessage => {
  return {
    id: String(counter++),
    message: msg,
    read: false,
    sender: sender,
    time: new Date(),
    type: HMSMessageType.CHAT,
    senderName: sender,
    ignored: false,
  };
};

export const fakeMessages = [
  makeFakeMessage('Hello from 100ms', 'Yash'),
  makeFakeMessage('This is a chat example', 'admin'),
  makeFakeMessage('via the sendBroadcast action', 'Yash'),
  makeFakeMessage('Our twitter handle @100mslive', '100ms'),
  makeFakeMessage('Type and send chat!', 'admin'),
];

export const fakeMessage = makeFakeMessage('where is everyone?', 'tushar');
