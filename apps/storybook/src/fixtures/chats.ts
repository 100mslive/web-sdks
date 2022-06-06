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
  makeFakeMessage('Hi guys', 'Yash'),
  makeFakeMessage('Ivy L left meeting', 'admin'),
  makeFakeMessage('Ping me at nikhil@100ms.live', 'Yash'),
  makeFakeMessage('Our twitter handle @100mslive', '100ms'),
  makeFakeMessage('Nikhil left meeting', 'admin'),
];

export const fakeMessage = makeFakeMessage('where is everyone?', 'tushar');
