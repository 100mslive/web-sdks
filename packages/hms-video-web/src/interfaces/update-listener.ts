import { HMSException } from '../error/HMSException';
import { HMSTrack } from '../media/tracks/HMSTrack';
import { HMSPeer } from '../sdk/models/peer';
import { HMSRoleChangeRequest } from './role-change-request';
import { HMSMessage } from './message';
import { HMSRoom } from './room';
import { HMSSpeaker } from './speaker';
import { DeviceChangeListener } from './device-change-listener';
import { HMSChangeMultiTrackStateRequest, HMSChangeTrackStateRequest } from './change-track-state';
import { HMSLeaveRoomRequest } from './leave-room-request';
import { HMSConnectionQuality } from './peer';

export enum HMSRoomUpdate {
  PEER_ADDED,
  PEER_REMOVED,
  PEER_KNOCKED,
  ROOM_TYPE_CHANGED,
  METADATA_UPDATED,
  SCREENSHARE_STARTED,
  SCREENSHARE_STOPPED,
  DEFAULT_UPDATE,
  RECORDING_STATE_UPDATED,
  BROWSER_RECORDING_STATE_UPDATED,
  SERVER_RECORDING_STATE_UPDATED,
  RTMP_STREAMING_STATE_UPDATED,
  HLS_STREAMING_STATE_UPDATED,
  ROOM_STATE,
}

export enum HMSPeerUpdate {
  PEER_JOINED,
  PEER_LEFT,
  AUDIO_TOGGLED,
  VIDEO_TOGGLED,
  BECAME_DOMINANT_SPEAKER,
  RESIGNED_DOMINANT_SPEAKER,
  STARTED_SPEAKING,
  STOPPED_SPEAKING,
  ROLE_UPDATED,
  PEER_LIST,
  NAME_UPDATED,
  METADATA_UPDATED,
}

export enum HMSTrackUpdate {
  TRACK_ADDED,
  TRACK_REMOVED,
  TRACK_MUTED,
  TRACK_UNMUTED,
  TRACK_DESCRIPTION_CHANGED,
  TRACK_DEGRADED,
  TRACK_RESTORED,
}

export interface HMSAudioListener {
  onAudioLevelUpdate(speakers: HMSSpeaker[]): void;
}

export interface HMSConnectionQualityListener {
  onConnectionQualityUpdate(qualityUpdates: HMSConnectionQuality[]): void;
}

export interface HMSUpdateListener extends DeviceChangeListener {
  onJoin(room: HMSRoom): void;
  onRoomUpdate(type: HMSRoomUpdate, room: HMSRoom): void;
  onPeerUpdate(type: HMSPeerUpdate, peer: HMSPeer | HMSPeer[] | null): void;
  onTrackUpdate(type: HMSTrackUpdate, track: HMSTrack, peer: HMSPeer): void;
  onMessageReceived(message: HMSMessage): void;
  onError(error: HMSException): void;
  onReconnecting(error: HMSException): void;
  onReconnected(): void;
  onRoleChangeRequest(request: HMSRoleChangeRequest): void;
  onRoleUpdate(newRole: string): void;
  onChangeTrackStateRequest(request: HMSChangeTrackStateRequest): void;
  onChangeMultiTrackStateRequest(request: HMSChangeMultiTrackStateRequest): void;
  onRemovedFromRoom(request: HMSLeaveRoomRequest): void;
}
