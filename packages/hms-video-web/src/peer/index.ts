import HMSPeer from '../interfaces/hms-peer';
import HMSTrack from '../media/tracks/HMSTrack';

type HMSPeerInit = {
  peerId: string;
  name: string;
  isLocal: boolean;
  customerDescription: string;
};

export default class Peer implements HMSPeer {
  peerId: string;
  isLocal: boolean;
  name: string;
  customerDescription: string = '';
  videoTrack?: HMSTrack | null;
  audioTrack?: HMSTrack | null;
  auxiliaryTracks: HMSTrack[] = [];

  constructor({ peerId, name, isLocal, customerDescription }: HMSPeerInit) {
    this.name = name;
    this.peerId = peerId;
    this.isLocal = isLocal;
    this.customerDescription = customerDescription;
  }
}
