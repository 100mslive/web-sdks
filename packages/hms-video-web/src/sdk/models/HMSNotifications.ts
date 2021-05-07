import HMSTrack from '../../media/tracks/HMSTrack';
import { Track } from '../../signal/ISignal';
import HMSLogger from '../../utils/logger';
import { HMSNotificationMethod } from './enums/HMSNotificationMethod';
import Message from './HMSMessage';
import { SpeakerList } from './HMSSpeaker';

export type HMSNotifications = Peer | PeerList | Message | TrackStateNotification | SpeakerList | undefined;

export interface TrackStateNotification {
  tracks: Map<string, TrackState>;
  peer: PeerNotificationInfo;
}

export interface PeerNotificationInfo {
  peer_id: string;
  info: Info;
}

export interface Info {
  name: string;
  data: string;
  userId: string;
}

export class TrackState implements Track {
  mute: boolean;
  type: 'audio' | 'video';
  source: 'regular' | 'screen' | 'plugin';
  description: string;
  track_id: string;
  stream_id: string;

  constructor(track: HMSTrack | Track) {
    this.type = track.type;
    this.source = track.source || 'regular';
    this.description = '';
    if (track instanceof HMSTrack) {
      this.mute = !track.enabled;
      this.track_id = track.trackId;
      this.stream_id = track.stream.id;
    } else {
      this.mute = track.mute;
      this.track_id = track.track_id;
      this.stream_id = track.stream_id;
    }
  }
}

export class Peer {
  peerId: string;
  info: Info;
  role: string;
  tracks: TrackState[] = [];

  constructor(params: any) {
    this.peerId = params.peer_id;
    this.info = {
      name: params.info.name,
      data: params.info.data,
      userId: params.info.user_id,
    };
    this.role = params.role;
    this.tracks = Object.values(params.tracks || {});
  }
}

export class PeerList {
  peers: Peer[];

  constructor(params: any) {
    this.peers = Object.values(params.peers).map((peer) => new Peer(peer));
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
    case HMSNotificationMethod.BROADCAST:
      return new Message(params.info);
    case HMSNotificationMethod.ACTIVE_SPEAKERS:
      return new SpeakerList(params['speaker-list']);
    case HMSNotificationMethod.ROLE_CHANGE:
      return params as TrackStateNotification;
    case HMSNotificationMethod.TRACK_METADATA_ADD:
    case HMSNotificationMethod.TRACK_UPDATE: {
      return params;
    }
    default:
      HMSLogger.d(`method not implemented ${method}`);
      return params;
  }
};
