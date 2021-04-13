import HMSTrack from '../transport/interfaces/hms-track';
import HMSRole from './role';

export default interface HMSPeer {
  peerId: string;
  name: string;
  isLocal: boolean;
  customerUserId?: string;
  customerDescription: string;
  videoTrack?: HMSTrack;
  audioTrack?: HMSTrack;
  auxiliaryTracks?: HMSTrack[];
  role?: HMSRole;
}
