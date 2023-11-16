import { HMSPeerWithMuteStatus } from '@100mslive/hms-video-store';

let counter = 1;
export const makeFakeParticipant = (name: string, role = 'Student'): HMSPeerWithMuteStatus => {
  return {
    peer: {
      id: String(counter++),
      name,
      roleName: role,
      auxiliaryTracks: [],
      isLocal: counter === 1,
      groups: [],
      isHandRaised: false,
    },
    isAudioEnabled: false,
  };
};

export const fakeParticipants = [
  makeFakeParticipant('Alex Tinmayson', 'Teacher'),
  makeFakeParticipant('Ankita Bhattacharya'),
  makeFakeParticipant('Anshul Kumar'),
  makeFakeParticipant('Ishaan Awasthi'),
  makeFakeParticipant('Ivy Loppinbug', 'Teacher'),
  makeFakeParticipant('Sudhanshu Kumar'),
];
