import { HMSVideoTrack } from '@100mslive/hms-video-store';

let counter = 100;

export const makeFakeVideoTrack = (): HMSVideoTrack => {
  return {
    enabled: false,
    id: String(counter++),
    type: 'video',
  } as HMSVideoTrack;
};
