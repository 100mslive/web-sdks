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
  networkQuality?: number;
  groups?: string[];
  realtime?: boolean;
  isHandRaised: boolean;

  updateRole(newRole: HMSRole): void;
  updateName(newName: string): void;
  updateMetadata(data: string): void;
  updateNetworkQuality(value: number): void;
  updateGroups(groups: string[]): void;
}
