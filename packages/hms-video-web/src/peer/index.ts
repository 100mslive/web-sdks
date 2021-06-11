import HMSPeer from '../interfaces/hms-peer';
import HMSTrack from '../media/tracks/HMSTrack';

type HMSPeerInit = {
  peerId: string;
  name: string;
  isLocal: boolean;
  customerUserId?: string;
  customerDescription?: string;
  role?: string;
};

export default class Peer implements HMSPeer {
  peerId: string;
  isLocal: boolean;
  name: string;
  customerUserId?: string = '';
  customerDescription?: string = '';
  videoTrack?: HMSTrack | null;
  audioTrack?: HMSTrack | null;
  auxiliaryTracks: HMSTrack[] = [];
  role?: string = '';

  constructor({ peerId, name, isLocal, role, customerUserId, customerDescription }: HMSPeerInit) {
    this.name = name;
    this.peerId = peerId;
    this.isLocal = isLocal;
    this.role = role;
    this.customerUserId = customerUserId;
    this.customerDescription = customerDescription;
  }
}
