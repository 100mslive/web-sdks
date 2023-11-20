import { HMSRemoteAudioTrack, HMSRemoteVideoTrack, HMSTrack } from '../../../coreSDK';

export function isRemoteTrack(track: HMSTrack) {
  return track instanceof HMSRemoteAudioTrack || track instanceof HMSRemoteVideoTrack;
}
