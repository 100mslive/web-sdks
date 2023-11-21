import { HMSAudioTrack } from '../media/tracks/HMSAudioTrack';
import { HMSPeer } from '../sdk/models/peer';

export interface HMSSpeaker {
  peer: HMSPeer;
  track: HMSAudioTrack;
  audioLevel: number;
}
