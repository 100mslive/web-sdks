import IHMSPeer from '../../../interfaces/hms-peer';
import HMSPolicy from '../../../interfaces/policy';
import HMSAudioTrack from '../../../media/tracks/HMSAudioTrack';
import HMSTrack from '../../../media/tracks/HMSTrack';
import HMSVideoTrack from '../../../media/tracks/HMSVideoTrack';

export type HMSPeerInit = {
  peerId: string;
  name: string;
  isLocal: boolean;
  customerUserId?: string;
  customerDescription?: string;
  role?: string;
  policy?: HMSPolicy;
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
  role?: string = '';
  policy?: HMSPolicy;

  constructor({ peerId, name, isLocal, role, customerUserId, customerDescription, policy }: HMSPeerInit) {
    this.name = name;
    this.peerId = peerId;
    this.isLocal = isLocal;
    this.role = role;
    this.customerUserId = customerUserId;
    this.customerDescription = customerDescription;
    this.policy = policy;
  }
}
