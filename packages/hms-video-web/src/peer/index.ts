import HMSPeer from '../interfaces/hms-peer';
import { v4 as uuidv4 } from 'uuid';
import HMSTrack from '../media/tracks/HMSTrack';

type HMSPeerInit = {
  peerId: string;
  name: string;
  isLocal: boolean;
  customerDescription: string;
};

export default class Peer implements HMSPeer {
  peerId: string = uuidv4();
  isLocal: boolean;
  name: string;
  customerDescription: string = '';
  videoTrack?: HMSTrack | null;
  audioTrack?: HMSTrack | null;

  constructor({ peerId, name, isLocal, customerDescription }: HMSPeerInit) {
    this.name = name;
    this.peerId = peerId;
    this.isLocal = isLocal;
    this.customerDescription = customerDescription;
  }
}
