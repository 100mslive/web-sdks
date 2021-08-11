import { HMSRemoteTrack, HMSRemoteAudioTrack, HMSRemoteVideoTrack } from '../../media/tracks';
import { HMSPeer } from './hms-peer';

export interface HMSRemotePeer extends HMSPeer {
  audioTrack?: HMSRemoteAudioTrack;
  videoTrack?: HMSRemoteVideoTrack;
  auxiliaryTracks: HMSRemoteTrack[];
}
