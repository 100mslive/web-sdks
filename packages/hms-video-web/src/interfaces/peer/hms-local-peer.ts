import { HMSPeer } from './hms-peer';
import { HMSLocalAudioTrack, HMSLocalTrack, HMSLocalVideoTrack } from '../../media/tracks';

export interface HMSLocalPeer extends HMSPeer {
  audioTrack?: HMSLocalAudioTrack;
  videoTrack?: HMSLocalVideoTrack;
  auxiliaryTracks: HMSLocalTrack[];
}
