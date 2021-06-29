import HMSAudioTrack from '../media/tracks/HMSAudioTrack';
import HMSTrack from '../media/tracks/HMSTrack';
import HMSVideoTrack from '../media/tracks/HMSVideoTrack';

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
}
