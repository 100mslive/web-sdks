import { HMSRemoteTrack } from '../media/streams/HMSRemoteStream';
import { HMSRemoteAudioTrack, HMSRemoteVideoTrack } from '../media/tracks';
import { IHMSPeer } from './hms-peer';

export interface IHMSRemotePeer extends IHMSPeer {
  isLocal: boolean;
  audioTrack?: HMSRemoteAudioTrack;
  videoTrack?: HMSRemoteVideoTrack;
  auxiliaryTracks: HMSRemoteTrack[];
}
