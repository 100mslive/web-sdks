import HMSRoom, { HMSRoomType } from '../../interfaces/room';
import { HMSSdk } from '..';

export default class Room implements HMSRoom {
  id: string;
  name: string;
  shareableLink!: string;
  type!: HMSRoomType;
  hasWaitingRoom!: boolean;
  private sdk: HMSSdk;

  public get localPeer() {
    return this.sdk.getLocalPeer();
  }

  public get peers() {
    return this.sdk.getPeers();
  }

  constructor(id: string, name: string, sdk: HMSSdk) {
    this.id = id;
    this.name = name;
    this.sdk = sdk;
  }
}
