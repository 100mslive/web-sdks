import { VideoTrackLayerUpdate } from '../connection/channel-messages';
import { HMSRole } from '../interfaces/role';
import { HMSLocalTrack } from '../media/tracks';
import { HMSTrack, HMSTrackSource } from '../media/tracks/HMSTrack';
import { Track } from '../signal/interfaces';

/**
 * Interfaces for message received from BIZ Signal through Websocket.
 * These messages are handled by NotificationManager
 * which will call the corresponding HMSUpdateListener callbacks.
 */

export interface ServerError {
  code: number;
  message?: string;
}

export interface TrackStateNotification {
  tracks: {
    [track_id: string]: TrackState;
  };
  peer: PeerNotificationInfo;
}

export interface OnTrackLayerUpdateNotification {
  tracks: {
    [track_id: string]: VideoTrackLayerUpdate;
  };
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
  template_id: string;
  app_data?: Record<string, string>;
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
      this.track_id = track.publishedTrackId!;
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
  joined_at?: number;
  tracks: {
    [track_id: string]: TrackState;
  };
  is_from_room_state?: boolean;
}

export interface RoomState {
  name: string;
  session_id?: string;
  started_at?: number;
  recording?: {
    sfu: {
      started_at?: number;
      enabled: boolean;
    };
    browser: {
      started_at?: number;
      enabled: boolean;
    };
    hls: {
      started_at?: number;
      enabled: boolean;
      config?: {
        hls_vod: boolean;
        single_file_per_layer: boolean;
      };
    };
  };
  streaming?: {
    enabled: boolean;
    rtmp: { enabled: boolean; started_at?: number };
    hls: HLSNotification;
  };
}

export interface PeerListNotification {
  peers: {
    [peer_id: string]: PeerNotification;
  };
  room: RoomState;
}

export interface PeriodicRoomState {
  peer_count: number;
  room: RoomState;
  peers?: {
    [peer_id: string]: PeerNotification;
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

interface ConnectionQuality {
  peer_id: string;
  downlink_score: number;
}

export interface ConnectionQualityList {
  peers: ConnectionQuality[];
}

/**
 * Represents the role change request received from the server
 */
export interface RoleChangeRequestParams {
  requested_by?: string;
  role: string;
  token: string;
}

export interface TrackUpdateRequestNotification {
  requested_by?: string;
  track_id: string;
  stream_id: string;
  mute: boolean;
}

export interface ChangeTrackMuteStateNotification {
  requested_by?: string;
  roles?: string[];
  type?: 'audio' | 'video';
  source?: HMSTrackSource;
  value: boolean;
}

export interface PeerLeaveRequestNotification {
  requested_by?: string;
  reason: string;
  room_end: boolean;
}

export interface MessageNotification {
  peer?: {
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
  message: any;
  type: string;
}

export interface RecordingNotification {
  type: 'sfu' | 'Browser';
  started_at?: number;
  peer?: PeerNotificationInfo;
  error?: ServerError;
}

export interface RTMPNotification {
  peer?: PeerNotificationInfo;
  started_at?: number;
  error?: ServerError;
}

export interface HLSNotification {
  enabled: boolean;
  variants?: Array<HLSVariantInfo>;
  error?: ServerError;
  hls_recording?: {
    hls_vod: boolean;
    single_file_per_layer: boolean;
  };
}

export interface HLSVariantInfo {
  url: string;
  meeting_url?: string;
  metadata?: string;
  started_at?: number;
}

export interface MetadataChangeNotification {
  values: {
    change_version?: number;
    updated_by?: string;
    data: any;
    key: string;
    updated_at?: number;
  }[];
}
