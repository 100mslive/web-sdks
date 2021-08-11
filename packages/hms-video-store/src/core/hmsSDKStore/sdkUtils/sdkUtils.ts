import {
  HMSTrack,
  HMSRemoteAudioTrack,
  HMSRemoteVideoTrack,
  HMSLocalVideoTrack,
} from '@100mslive/hms-video';

export function isRemoteTrack(track: HMSTrack) {
  return track instanceof HMSRemoteAudioTrack || track instanceof HMSRemoteVideoTrack;
}

export function getStoreTrackIDfromSDKTrack(track: HMSTrack) {
  if (track instanceof HMSLocalVideoTrack) {
    return track.initiallyPublishedTrackId;
  }
  return track.trackId;
}
