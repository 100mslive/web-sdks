import { HMSAudioTrack, HMSVideoTrack, HMSTrack } from '../media/tracks';
import HMSPolicy from './policy';

export default interface IHMSPeer {
  peerId: string;
  name: string;
  isLocal: boolean;
  customerUserId?: string;
  customerDescription?: string;
  audioTrack?: HMSAudioTrack;
  videoTrack?: HMSVideoTrack;
  auxiliaryTracks: HMSTrack[];
  role?: string;
  policy?: HMSPolicy;
}
