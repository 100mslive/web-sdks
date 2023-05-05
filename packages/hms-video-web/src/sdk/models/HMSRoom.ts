import { HMSHLS, HMSRecording, HMSRoom, HMSRTMP } from '../../interfaces/room';
import { IStore } from '../store/IStore';

export default class Room implements HMSRoom {
  sessionId?: string;
  startedAt?: Date;
  recording: HMSRecording = { server: { running: false }, browser: { running: false }, hls: { running: false } };
  rtmp: HMSRTMP = { running: false };
  hls: HMSHLS = { running: false, variants: [] };
  name?: string;
  peerCount?: number;

  public get localPeer() {
    return this.store.getLocalPeer()!;
  }

  public get peers() {
    return this.store.getPeers();
  }

  constructor(public id: string, private store: IStore) {}
}
