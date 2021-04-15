import Peer from '../../peer';
import HMSRoom, { HMSRoomType } from '../../interfaces/room';

export default class Room implements HMSRoom {
  id: string;
  name: string;
  peers: Peer[];
  shareableLink!: string;
  type!: HMSRoomType;
  hasWaitingRoom!: boolean;

  constructor(id: string, name: string, peers: Peer[]) {
    this.id = id;
    this.name = name;
    this.peers = peers;
  }
}
