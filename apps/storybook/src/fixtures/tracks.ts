import { HMSTrack } from '@100mslive/hms-video-store';

let counter = 100;

export const makeFakeTrack = (): HMSTrack => {
  return {
    enabled: false,
    id: String(counter++),
    type: 'video',
  };
};
