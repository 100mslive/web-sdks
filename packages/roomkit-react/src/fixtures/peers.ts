import { HMSPeerType, HMSPeerWithMuteStatus } from '@100mslive/react-sdk';

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
      handRaisedAt: -1,
      type: HMSPeerType.REGULAR,
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
