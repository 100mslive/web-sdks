import HMSRoom, { HMSRoomType } from '../../interfaces/room';
import { IStore } from '../store/IStore';

export default class Room implements HMSRoom {
  shareableLink!: string;
  type!: HMSRoomType;
  hasWaitingRoom!: boolean;

  public get localPeer() {
    return this.store.getLocalPeer();
  }

  public get peers() {
    return this.store.getPeers();
  }

  constructor(public id: string, public name: string, private store: IStore) {}
}
