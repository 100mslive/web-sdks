import { HMSAudioTrack, HMSPeer, HMSVideoTrack, HMSTrackType } from '../core';

let counter = 100;
type HMSObjectType<T> = 
  T extends "audio" ? HMSAudioTrack :
  T extends "video" ? HMSVideoTrack :
  HMSVideoTrack;
export const makeFakeTrack = <T extends HMSTrackType>(type?: HMSTrackType): HMSObjectType<T> => {
  if (type === 'audio') {
    return {
      enabled: false,
      id: String(counter++),
      type: type,
    } as HMSObjectType<T>;
  } else {
    return {
      enabled: false,
      id: String(counter++),
      type: type || 'video',
    } as HMSObjectType<T>;
  }
};

export const makeFakePeer = (): HMSPeer => {
  return {
    audioTrack: '',
    auxiliaryTracks: [],
    id: String(counter++),
    isLocal: false,
    name: 'test',
    videoTrack: '',
  };
};
