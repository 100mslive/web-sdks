import { HMSNotificationMethod } from './enums/HMSNotificationMethod';
import PeerInfo from './PeerInfo';

export type HMSNotifications = Peer | Stream | PeerList | undefined;

export class Peer {
  uid: string;
  sid: string;
  info!: PeerInfo;

  constructor(params: any) {
    this.uid = params.uid;
    this.sid = params.sid;
    this.info = new PeerInfo(params.info);
  }
}

export class StreamInternal {
  uid: string;
  streamId: string;

  constructor(params: any) {
    this.uid = params.uid;
    this.streamId = params.streamId;
  }
}

export class Stream {
  uid: string;
  stream: StreamInternal;
  streamId: string;

  constructor(params: any) {
    this.uid = params.uid;
    this.stream = params.stream;
    this.streamId = this.stream!.streamId;
  }
}

export class PeerList {
  peers: Peer[];
  streams: StreamInternal[];

  constructor(params: any) {
    this.peers = params.peers;
    this.streams = params.streams;
  }
}

export const getNotification = (method: HMSNotificationMethod, params: any) => {
  switch (method) {
    case HMSNotificationMethod.PEER_JOIN:
      return new Peer(params);
    case HMSNotificationMethod.PEER_LEAVE:
      return new Peer(params);
    case HMSNotificationMethod.PEER_LIST:
      return new PeerList(params);
    case HMSNotificationMethod.STREAM_ADD:
      return new Stream(params);
    case HMSNotificationMethod.ACTIVE_SPEAKERS: // TODO: Write Code for this
      return;
    default:
      throw Error(`Unsupported method=${method} received`);
  }
};
