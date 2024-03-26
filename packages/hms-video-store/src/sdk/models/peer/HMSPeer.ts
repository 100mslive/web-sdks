import { HMSPeer as IHMSPeer } from '../../../interfaces/peer';
import { HMSPeerType } from '../../../interfaces/peer/hms-peer';
import { HMSRole } from '../../../interfaces/role';
import { HMSAudioTrack, HMSTrack, HMSVideoTrack } from '../../../media/tracks';
import { HAND_RAISE_GROUP_NAME } from '../../../utils/constants';

export type HMSPeerInit = {
  peerId: string;
  name: string;
  isLocal: boolean;
  customerUserId?: string;
  metadata?: string;
  role?: HMSRole;
  joinedAt?: Date;
  fromRoomState?: boolean;
  metworkQuality?: number;
  groups?: string[];
  realtime?: boolean;
  isHandRaised?: boolean;
  type: HMSPeerType;
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
  networkQuality?: number;
  groups?: string[];
  realtime?: boolean;
  type: HMSPeerType;

  constructor({
    peerId,
    name,
    isLocal,
    customerUserId,
    metadata,
    role,
    joinedAt,
    groups,
    realtime,
    type,
  }: HMSPeerInit) {
    this.name = name;
    this.peerId = peerId;
    this.isLocal = isLocal;
    this.customerUserId = customerUserId;
    this.metadata = metadata;
    this.joinedAt = joinedAt;
    this.groups = groups;
    this.realtime = realtime;
    this.type = type;

    if (role) {
      this.role = role;
    }
  }

  get isHandRaised() {
    return !!this.groups?.includes(HAND_RAISE_GROUP_NAME);
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

  updateNetworkQuality(quality: number) {
    this.networkQuality = quality;
  }

  /**
   * @internal
   */
  updateMetadata(data: string) {
    this.metadata = data;
  }

  updateGroups(groups: string[]) {
    this.groups = groups;
  }

  toString() {
    return `{
      name: ${this.name};
      role: ${this.role?.name};
      peerId: ${this.peerId};
      customerUserId: ${this.customerUserId};
      ${this.audioTrack ? `audioTrack: ${this.audioTrack?.trackId};` : ''}
      ${this.videoTrack ? `videoTrack: ${this.videoTrack?.trackId};` : ''}
      groups: ${this.groups?.join()}
    }`;
  }
}
