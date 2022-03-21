import { HMSPeer as IHMSPeer } from '../../../interfaces/peer';
import { HMSRole } from '../../../interfaces/role';
import { HMSAudioTrack, HMSTrack, HMSVideoTrack } from '../../../media/tracks';

export type HMSPeerInit = {
  peerId: string;
  name: string;
  isLocal: boolean;
  customerUserId?: string;
  metadata?: string;
  role?: HMSRole;
};

export class HMSPeer implements IHMSPeer {
  readonly peerId: string;
  readonly isLocal: boolean;
  name: string;
  customerUserId?: string = '';
  metadata?: string = '';
  audioTrack?: HMSAudioTrack;
  videoTrack?: HMSVideoTrack;
  auxiliaryTracks: HMSTrack[] = [];
  role?: HMSRole;

  constructor({ peerId, name, isLocal, customerUserId, metadata, role }: HMSPeerInit) {
    this.name = name;
    this.peerId = peerId;
    this.isLocal = isLocal;
    this.customerUserId = customerUserId;
    this.metadata = metadata;

    if (role) {
      this.role = role;
    }
  }

  /**
   * @internal
   */
  updateRole(newRole: HMSRole) {
    this.role = newRole;
  }
  /**
   * @internal
   */
  updateName(newName: string) {
    this.name = newName;
  }
  /**
   * @internal
   */
  updateMetadata(data: string) {
    this.metadata = data;
  }
}
