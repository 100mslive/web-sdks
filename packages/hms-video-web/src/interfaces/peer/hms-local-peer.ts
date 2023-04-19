import { HMSPeer } from './hms-peer';
import { HMSLocalAudioTrack, HMSLocalTrack, HMSLocalVideoTrack } from '../../media/tracks';
import { HMSRole } from '../role';

export interface HMSLocalPeer extends HMSPeer {
  asRole?: HMSRole;
  audioTrack?: HMSLocalAudioTrack;
  videoTrack?: HMSLocalVideoTrack;
  auxiliaryTracks: HMSLocalTrack[];

  isInPreview: () => boolean;
}
