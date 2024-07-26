import { VideoTrackLayerUpdate } from '../connection/channel-messages';
import { HMSPeerType } from '../interfaces/peer/hms-peer';
import { HMSRole } from '../interfaces/role';
import { HMSLocalTrack } from '../media/tracks';
import { HMSTrack, HMSTrackSource } from '../media/tracks/HMSTrack';
import { PollInfoParams, PollResult, Track } from '../signal/interfaces';

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
  role: string;
  groups: string[];
  info: Info;
}

export interface Info {
  name: string;
  data: string;
  user_id: string;
  type: HMSPeerType;
}

export interface FindPeerByNameInfo {
  name: string;
  peer_id: string;
  role: string;
  type: HMSPeerType;
}

export enum HMSRecordingState {
  NONE = 'none',
  INITIALISED = 'initialised',
  STARTED = 'started',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  STOPPED = 'stopped',
  FAILED = 'failed',
}

export enum HMSStreamingState {
  NONE = 'none',
  INITIALISED = 'initialised',
  STARTED = 'started',
  STOPPED = 'stopped',
  FAILED = 'failed',
}

export enum HMSTranscriptionState {
  INITIALISED = 'initialised',
  STARTED = 'started',
  STOPPED = 'stopped',
  FAILED = 'failed',
}
export enum HMSTranscriptionMode {
  CAPTION = 'caption',
}
export interface WhiteBoardPluginPermissions {
  permissions?: {
    // list of roles
    admin?: Array<string>;
    writer?: Array<string>;
    reader?: Array<string>;
  };
}

export interface TranscriptionPluginPermissions {
  permissions?: {
    // list of roles
    admin?: Array<string>;
  };
  mode: HMSTranscriptionMode;
}

export interface NoiseCancellationPlugin {
  enabled?: boolean;
}
export enum Plugins {
  WHITEBOARD = 'whiteboard',
  TRANSCRIPTIONS = 'transcriptions',
  NOISE_CANCELLATION = 'noiseCancellation',
}

export interface PolicyParams {
  name: string;
  known_roles: {
    [role: string]: HMSRole;
  };
  plugins: {
    [Plugins.WHITEBOARD]?: WhiteBoardPluginPermissions;
    [Plugins.TRANSCRIPTIONS]?: TranscriptionPluginPermissions[];
    [Plugins.NOISE_CANCELLATION]?: NoiseCancellationPlugin;
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
  groups: string[];
  realtime?: boolean;
  is_from_room_state?: boolean;
}

export interface TranscriptionNotification {
  state?: HMSTranscriptionState;
  mode?: HMSTranscriptionMode;
  initialised_at?: number;
  started_at?: number;
  updated_at?: number;
  stopped_at?: number;
  peer?: PeerNotificationInfo;
  error?: ServerError;
}

export interface RoomState {
  name: string;
  session_id?: string;
  started_at?: number;
  recording?: {
    sfu: {
      started_at?: number;
      enabled: boolean;
      state?: HMSRecordingState;
    };
    browser: {
      started_at?: number;
      enabled: boolean;
      state?: HMSRecordingState;
    };
    hls: {
      initialised_at?: number;
      started_at?: number;
      enabled: boolean;
      state?: HMSRecordingState;
      config?: {
        hls_vod: boolean;
        single_file_per_layer: boolean;
      };
    };
  };
  streaming?: {
    enabled: boolean;
    rtmp: { enabled: boolean; started_at?: number; state?: HMSStreamingState };
    hls: HLSNotification;
  };
  transcriptions?: TranscriptionNotification[];
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
    groups: string[];
    role: string;
    info: {
      name: string;
      data: any;
      user_id: string;
    };
  };
  roles?: string[];
  message_id: string;
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
export enum RecordingNotificationType {
  SFU = 'sfu',
  BROWSER = 'Browser',
  HLS = 'HLS',
}
export interface RecordingNotification {
  type: RecordingNotificationType;
  initialised_at?: number; // only used for type hls
  started_at?: number;
  peer?: PeerNotificationInfo;
  error?: ServerError;
  state?: HMSRecordingState;
  hls_recording?: HLSRecording; // only used for type hls
}

export interface RTMPNotification {
  peer?: PeerNotificationInfo;
  error?: ServerError;
  started_at?: number;
  state?: HMSStreamingState;
}

export interface HLSRecording {
  hls_vod: boolean;
  single_file_per_layer: boolean;
}

export interface HLSNotification {
  enabled: boolean;
  variants?: Array<HLSVariantInfo>;
  error?: ServerError;
  hls_recording?: HLSRecording;
}

export enum HLSPlaylistType {
  DVR = 'dvr',
  NO_DVR = 'no-dvr',
}
export enum HLSStreamType {
  REGULAR = 'regular',
  SCREEN = 'screen',
  COMPOSITE = 'composite',
}
export interface HLSVariantInfo {
  url: string;
  meeting_url?: string;
  playlist_type?: HLSPlaylistType;
  metadata?: string;
  started_at?: number;
  initialised_at?: number;
  state?: HMSStreamingState;
  stream_type?: HLSStreamType;
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

export interface PollStartNotification {
  polls: PollInfoParams[];
}

export type PollStopNotification = PollStartNotification;

export interface PollStats extends PollResult {
  poll_id: string;
}
export interface PollStatsNotification {
  polls: PollStats[];
}

export interface RoomInfo {
  room_id: string;
  name: string;
  description: string;
  max_size: number;
  large_room_optimization: boolean;
}

export interface SessionInfo {
  session_id: string;
  room_id: string;
  peer_count: number;
  track_count: number;
}

export interface WhiteboardInfo {
  id: string;
  title?: string;
  owner?: string;
  state?: string;
  attributes?: Array<{ name: string; value: unknown }>;
}

export interface NodeInfo {
  sfu_node_id: string;
}
