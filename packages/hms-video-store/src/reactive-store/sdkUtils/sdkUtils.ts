import { HMSRemoteAudioTrack, HMSRemoteVideoTrack, HMSTrack } from '../../internal';

export function isRemoteTrack(track: HMSTrack) {
  return track instanceof HMSRemoteAudioTrack || track instanceof HMSRemoteVideoTrack;
}
