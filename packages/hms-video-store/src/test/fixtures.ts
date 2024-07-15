import { HMSPeerType } from '../interfaces';
import { HMSAudioTrack, HMSPeer, HMSTrackType, HMSVideoTrack } from '../';

let counter = 100;
type HMSObjectType<T> = T extends 'audio' ? HMSAudioTrack : T extends 'video' ? HMSVideoTrack : HMSVideoTrack;
export const makeFakeTrack = <T extends HMSTrackType>(type?: T): HMSObjectType<T> => {
  return {
    enabled: false,
    id: String(counter++),
    type: type || 'video',
  } as HMSObjectType<T>;
};

export const makeFakePeer = (): HMSPeer => {
  return {
    audioTrack: '',
    auxiliaryTracks: [],
    id: String(counter++),
    isLocal: false,
    name: 'test',
    videoTrack: '',
    groups: [],
    isHandRaised: false,
    type: HMSPeerType.REGULAR,
  };
};
