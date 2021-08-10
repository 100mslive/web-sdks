import { IHMSPeer } from '../../../interfaces/hms-peer';
import { HMSRole } from '../../../interfaces/role';
import { HMSAudioTrack, HMSTrack, HMSVideoTrack } from '../../../media/tracks';

export type HMSPeerInit = {
  peerId: string;
  name: string;
  isLocal: boolean;
  customerUserId?: string;
  customerDescription?: string;
  role?: HMSRole;
};

export class HMSPeer implements IHMSPeer {
  readonly peerId: string;
  readonly isLocal: boolean;
  name: string;
  customerUserId?: string = '';
  customerDescription?: string = '';
  audioTrack?: HMSAudioTrack;
  videoTrack?: HMSVideoTrack;
  auxiliaryTracks: HMSTrack[] = [];
  role?: HMSRole;

  constructor({ peerId, name, isLocal, customerUserId, customerDescription, role }: HMSPeerInit) {
    this.name = name;
    this.peerId = peerId;
    this.isLocal = isLocal;
    this.customerUserId = customerUserId;
    this.customerDescription = customerDescription;

    if (role) {
      this.role = role;
    }
  }

  updateRole(newRole: HMSRole) {
    this.role = newRole;
  }
}
