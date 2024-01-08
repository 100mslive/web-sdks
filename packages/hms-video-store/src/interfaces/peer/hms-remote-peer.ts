import { HMSPeer } from './hms-peer';
import { HMSRemoteAudioTrack, HMSRemoteTrack, HMSRemoteVideoTrack } from '../../media/tracks';

export interface HMSRemotePeer extends HMSPeer {
  audioTrack?: HMSRemoteAudioTrack;
  videoTrack?: HMSRemoteVideoTrack;
  auxiliaryTracks: HMSRemoteTrack[];
  fromRoomState: boolean;
}
