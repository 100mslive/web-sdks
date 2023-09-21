import { HMSChangeMultiTrackStateRequest, HMSChangeTrackStateRequest } from './change-track-state';
import { DeviceChangeListener } from './devices';
import { HMSLeaveRoomRequest } from './leave-room-request';
import { HMSMessage } from './message';
import { HMSConnectionQuality } from './peer';
import { HMSRoleChangeRequest } from './role-change-request';
import { HMSRoom } from './room';
import { HMSPoll, SessionStoreUpdate } from './session-store';
import { HMSSpeaker } from './speaker';
import { HMSException } from '../error/HMSException';
import { HMSTrack } from '../media/tracks/HMSTrack';
import { HMSPeer } from '../sdk/models/peer';

export enum HMSRoomUpdate {
  RECORDING_STATE_UPDATED = 'RECORDING_STATE_UPDATED',
  BROWSER_RECORDING_STATE_UPDATED = 'BROWSER_RECORDING_STATE_UPDATED',
  SERVER_RECORDING_STATE_UPDATED = 'SERVER_RECORDING_STATE_UPDATED',
  RTMP_STREAMING_STATE_UPDATED = 'RTMP_STREAMING_STATE_UPDATED',
  HLS_STREAMING_STATE_UPDATED = 'HLS_STREAMING_STATE_UPDATED',
  ROOM_PEER_COUNT_UPDATED = 'ROOM_PEER_COUNT_UPDATED',
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
  HAND_RAISE_CHANGED,
  PEER_REMOVED,
  PEER_ADDED,
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

export enum HMSPollsUpdate {
  POLL_CREATED,
  POLL_STARTED,
  POLL_STOPPED,
  POLL_STATS_UPDATED,
}

export interface HMSAudioListener {
  onAudioLevelUpdate(speakers: HMSSpeaker[]): void;
}

export interface HMSConnectionQualityListener {
  onConnectionQualityUpdate(qualityUpdates: HMSConnectionQuality[]): void;
}

export interface SessionStoreListener {
  onSessionStoreUpdate(values: SessionStoreUpdate[]): void;
}

export interface PollsListener {
  onPollsUpdate(type: HMSPollsUpdate, polls: HMSPoll[]): void;
}

export interface HMSUpdateListener extends DeviceChangeListener, SessionStoreListener, PollsListener {
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
  onNetworkQuality?(score: number): void;
  onPreview(room: HMSRoom, localTracks: HMSTrack[]): void;
}
