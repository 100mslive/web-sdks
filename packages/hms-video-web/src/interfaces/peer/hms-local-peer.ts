import { HMSLocalAudioTrack, HMSLocalVideoTrack, HMSLocalTrack } from '../../media/tracks';
import { HMSPeer } from './hms-peer';

export interface HMSLocalPeer extends HMSPeer {
  audioTrack?: HMSLocalAudioTrack;
  videoTrack?: HMSLocalVideoTrack;
  auxiliaryTracks: HMSLocalTrack[];
}
