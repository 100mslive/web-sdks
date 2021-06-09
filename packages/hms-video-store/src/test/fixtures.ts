import { HMSPeer, HMSTrack, HMSTrackType } from '../core';

let counter = 100;

export const makeFakeTrack = (type?: HMSTrackType): HMSTrack => {
  return {
    enabled: false,
    id: String(counter++),
    type: type || 'video',
  };
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
