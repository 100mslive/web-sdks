import { HMSAudioTrack, HMSVideoTrack, HMSTrack } from '../media/tracks';
import { HMSRole } from './role';

export interface IHMSPeer {
  peerId: string;
  name: string;
  isLocal: boolean;
  customerUserId?: string;
  customerDescription?: string;
  audioTrack?: HMSAudioTrack;
  videoTrack?: HMSVideoTrack;
  auxiliaryTracks: HMSTrack[];
  role?: HMSRole;

  updateRole(newRole: HMSRole): void;
}
