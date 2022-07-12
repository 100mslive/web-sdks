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
  metadata?: any = {};
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
    this.updateMetadata(metadata);
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
   * if metadata is string, try to parse it as json, and store as json.
   * JSON.parse is an expensive operation to do frequently, it's better to do it
   * once given that json is a common use case.
   * @internal
   */
  updateMetadata(data?: string) {
    if (!data || data === '') {
      this.metadata = {};
    } else if (typeof data === 'string') {
      try {
        this.metadata = JSON.parse(data);
      } catch (err) {
        this.metadata = data;
      }
    } else {
      this.metadata = data;
    }
  }
}
