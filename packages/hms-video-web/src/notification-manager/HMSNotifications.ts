import { HMSTrack, HMSTrackSource } from '../media/tracks/HMSTrack';
import { HMSRole } from '../interfaces/role';
import { Track } from '../signal/interfaces';
import { HMSLocalTrack } from '../media/tracks';

/**
 * Interfaces for message received from BIZ Signal through Websocket.
 * These messages are handled by NotificationManager
 * which will call the corresponding HMSUpdateListener callbacks.
 */

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
  user_id: string;
}

export interface PolicyParams {
  name: string;
  known_roles: {
    [role: string]: HMSRole;
  };
}

/**
 * This is in a format biz sends/received the track metadata
 */
export class TrackState implements Track {
  mute: boolean;
  type: 'audio' | 'video';
  source: HMSTrackSource;
  description: string;
  track_id: string;
  stream_id: string;

  constructor(track: HMSLocalTrack | Track) {
    this.type = track.type;
    this.source = track.source || 'regular';
    this.description = '';
    if (track instanceof HMSTrack) {
      this.mute = !track.enabled;
      this.track_id = track.publishedTrackId;
      this.stream_id = track.stream.id;
    } else {
      this.mute = track.mute;
      this.track_id = track.track_id;
      this.stream_id = track.stream_id;
    }
  }
}

export interface PeerNotification {
  peer_id: string;
  info: Info;
  role: string;
  tracks: {
    [track_id: string]: TrackState;
  };
}

export interface FlatPeerNotification {
  peer_id: string;
  name: string;
  user_id: string;
  joined_at: string;
  role: string;
  data: string;
}

export interface SessionState {
  name: string;
  session_id: string;
  started_at: number;
  recording: {
    sfu: {
      enabled: boolean;
    };
    beam: {
      enabled: boolean;
    };
  };
  streaming: {
    enabled: boolean;
    rtmp: { enabled: boolean; started_at?: number };
    hls: { enabled: boolean; variants: Array<HLSVariantInfo> };
  };
}

export interface RoomState {
  room_id: string;
  name: string;
}

export interface PeerListNotification {
  peers: {
    [peer_id: string]: PeerNotification;
  };
  room: SessionState;
}

export interface PeriodicRoomState {
  room: RoomState;
  session: SessionState;
  peers: {
    [peer_id: string]: FlatPeerNotification;
  };
}

interface Speaker {
  peer_id: string;
  track_id: string;
  level: number;
}

export interface SpeakerList {
  'speaker-list': Speaker[];
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

export interface ChangeTrackMuteStateNotification {
  requested_by: string;
  roles?: string[];
  type?: 'audio' | 'video';
  source?: HMSTrackSource;
  value: boolean;
}

export interface PeerLeaveRequestNotification {
  requested_by: string;
  reason: string;
  room_end: boolean;
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

export interface RecordingNotification {
  type: 'sfu' | 'Browser';
  peer: PeerNotificationInfo;
}

export interface RTMPNotification {
  peer: PeerNotificationInfo;
  started_at?: number;
}

export interface HLSNotification {
  enabled: boolean;
  variants: Array<HLSVariantInfo>;
}

export interface HLSVariantInfo {
  url: string;
  meeting_url?: string;
  metadata?: string;
  started_at?: string;
}
