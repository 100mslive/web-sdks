import { HMSPeer, HMSTrack } from './peer';
import { HMSMessage } from './message';
import { HMSException } from './error';
import { HMSChangeMultiTrackStateRequest, HMSChangeTrackStateRequest, HMSLeaveRoomRequest } from './requests';
import { HMSDeviceChangeEvent } from './device-change';
import { HMSPlaylistItem } from './playlist';

export interface HMSNotification<T = any> {
  id: number;
  type: string;
  message: string;
  data?:
    | HMSPeer
    | HMSPeer[]
    | HMSTrack
    | HMSMessage
    | HMSException
    | HMSChangeTrackStateRequest
    | HMSChangeMultiTrackStateRequest
    | HMSLeaveRoomRequest
    | HMSDeviceChangeEvent
    | HMSPlaylistItem<T>
    | null;
  severity?: HMSNotificationSeverity;
}
export enum HMSNotificationSeverity {
  INFO = 'info',
  ERROR = 'error',
}

export enum HMSNotificationTypes {
  PEER_JOINED = 'PEER_JOINED',
  PEER_LEFT = 'PEER_LEFT',
  PEER_LIST = 'PEER_LIST',
  NEW_MESSAGE = 'NEW_MESSAGE',
  ERROR = 'ERROR',
  RECONNECTING = 'RECONNECTING',
  RECONNECTED = 'RECONNECTED',
  TRACK_ADDED = 'TRACK_ADDED',
  TRACK_REMOVED = 'TRACK_REMOVED',
  TRACK_MUTED = 'TRACK_MUTED',
  TRACK_UNMUTED = 'TRACK_UNMUTED',
  TRACK_DEGRADED = 'TRACK_DEGRADED',
  TRACK_RESTORED = 'TRACK_RESTORED',
  TRACK_DESCRIPTION_CHANGED = 'TRACK_DESCRIPTION_CHANGED',
  ROLE_UPDATED = 'ROLE_UPDATED',
  CHANGE_TRACK_STATE_REQUEST = 'CHANGE_TRACK_STATE_REQUEST',
  CHANGE_MULTI_TRACK_STATE_REQUEST = 'CHANGE_MULTI_TRACK_STATE_REQUEST',
  ROOM_ENDED = 'ROOM_ENDED',
  REMOVED_FROM_ROOM = 'REMOVED_FROM_ROOM',
  DEVICE_CHANGE_UPDATE = 'DEVICE_CHANGE_UPDATE',
  PLAYLIST_TRACK_ENDED = 'PLAYLIST_TRACK_ENDED',
  NAME_UPDATED = 'NAME_UPDATED',
  METADATA_UPDATED = 'METADATA_UPDATED',
}
