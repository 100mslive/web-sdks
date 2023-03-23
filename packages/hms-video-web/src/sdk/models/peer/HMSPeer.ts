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
  joinedAt?: Date;
  fromRoomState?: boolean;
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
  joinedAt?: Date;

  constructor({ peerId, name, isLocal, customerUserId, metadata, role, joinedAt }: HMSPeerInit) {
    this.name = name;
    this.peerId = peerId;
    this.isLocal = isLocal;
    this.customerUserId = customerUserId;
    this.metadata = metadata;
    this.joinedAt = joinedAt;

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

  toString() {
    return `{
      name: ${this.name};
      role: ${this.role?.name};
      peerId: ${this.peerId};
      customerUserId: ${this.customerUserId};
      ${this.audioTrack ? `audioTrack: ${this.audioTrack?.trackId};` : ''}
      ${this.videoTrack ? `videoTrack: ${this.videoTrack?.trackId};` : ''}
    }`;
  }
}
