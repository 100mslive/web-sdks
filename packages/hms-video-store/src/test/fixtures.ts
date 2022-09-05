import { HMSAudioTrack, HMSPeer, HMSTrack, HMSVideoTrack, HMSTrackType } from '../core';

let counter = 100;

export const makeFakeTrack = (type?: HMSTrackType): HMSTrack => {
  if (type === 'audio') {
    return {
      enabled: false,
      id: String(counter++),
      type: type,
    } as HMSAudioTrack;
  } else {
    return {
      enabled: false,
      id: String(counter++),
      type: type || 'video',
    } as HMSVideoTrack;
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
