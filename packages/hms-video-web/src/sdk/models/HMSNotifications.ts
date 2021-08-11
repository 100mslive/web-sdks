import { HMSTrack } from '../../media/tracks/HMSTrack';
import { HMSRole } from '../../interfaces/role';
import { Track } from '../../signal/interfaces';
import HMSLogger from '../../utils/logger';
import { HMSNotificationMethod } from './enums/HMSNotificationMethod';

export type HMSNotifications =
  | Peer
  | PeerList
  | MessageNotification
  | TrackStateNotification
  | SpeakerList
  | PolicyParams
  | RoleChangeRequestParams
  | TrackUpdateRequestNotification
  | undefined;

export interface TrackStateNotification {
  tracks: {
    [track_id: string]: TrackState;
  };
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

export interface PolicyParams {
  name: string;
  known_roles: {
    [role: string]: HMSRole;
  };
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
  tracks: {
    [track_id: string]: TrackState;
  };

  constructor(params: any) {
    this.peerId = params.peer_id;
    this.info = {
      name: params.info.name,
      data: params.info.data,
      userId: params.info.user_id,
    };
    this.role = params.role;
    this.tracks = params.tracks || {};
  }
}

export class PeerList {
  peers: Peer[];

  constructor(params: any) {
    this.peers = Object.values(params.peers).map((peer) => new Peer(peer));
  }
}

export interface Speaker {
  peerId: string;
  trackId: string;
  audioLevel: number;
}

export class SpeakerList {
  speakers: Speaker[] = [];

  constructor(speakerList: any) {
    if (speakerList && speakerList.length > 0) {
      this.speakers = speakerList.map((speaker: any) => ({
        peerId: speaker.peer_id,
        trackId: speaker.track_id,
        audioLevel: speaker.level,
      }));
    }
  }
}

/**
 * Represents the role change request received from the server
 */
export interface RoleChangeRequestParams {
  requested_by: string;
  role: string;
  token: string;
}

export interface TrackUpdateRequestNotification {
  requested_by: string;
  track_id: string;
  stream_id: string;
  mute: boolean;
}

export interface MessageNotification {
  peer: {
    peer_id: string;
    info: {
      name: string;
      data: any;
      user_id: string;
    };
  };
  roles?: string[];
  private: boolean;
  timestamp: number;
  info: MessageNotificationInfo;
}

export interface SendMessage {
  info: MessageNotificationInfo;
  roles?: string[];
  peer_id?: string;
}

export interface MessageNotificationInfo {
  sender: string;
  message: any;
  type: string;
  time?: string;
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
      return params as MessageNotification;
    case HMSNotificationMethod.ACTIVE_SPEAKERS:
      return new SpeakerList(params['speaker-list']);
    case HMSNotificationMethod.ROLE_CHANGE:
      return params as TrackStateNotification;
    case HMSNotificationMethod.TRACK_METADATA_ADD:
    case HMSNotificationMethod.TRACK_UPDATE: {
      return params;
    }
    case HMSNotificationMethod.POLICY_CHANGE:
      return params;
    case HMSNotificationMethod.ROLE_CHANGE_REQUEST:
      return params;
    case HMSNotificationMethod.TRACK_UPDATE_REQUEST:
      return params;
    case HMSNotificationMethod.PEER_UPDATE:
      return new Peer(params);
    default:
      HMSLogger.d(`method not implemented ${method}`);
      return params;
  }
};
