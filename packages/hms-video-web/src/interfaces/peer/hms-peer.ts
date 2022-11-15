import { HMSAudioTrack, HMSTrack, HMSVideoTrack } from '../../media/tracks';
import { HMSRole } from '../role';

export interface HMSPeer {
  peerId: string;
  name: string;
  isLocal: boolean;
  joinedAt?: Date;
  customerUserId?: string;
  metadata?: string;
  audioTrack?: HMSAudioTrack;
  videoTrack?: HMSVideoTrack;
  auxiliaryTracks: HMSTrack[];
  role?: HMSRole;

  updateRole(newRole: HMSRole): void;
  updateName(newName: string): void;
  updateMetadata(data: string): void;
}
