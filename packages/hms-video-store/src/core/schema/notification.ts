import { HMSPeer, HMSTrack } from './peer';
import { HMSMessage } from './message';
import { HMSException } from './error';
import { HMSChangeMultiTrackStateRequest, HMSChangeTrackStateRequest, HMSLeaveRoomRequest } from './requests';
import { HMSDeviceChangeEvent } from './device-change';
import { HMSPlaylistItem } from './playlist';

interface BaseNotification {
  id: number;
  type: string;
  message: string;
  severity?: HMSNotificationSeverity;
}
interface PeerNotification extends BaseNotification {
  data?: HMSPeer;
}

interface PeerArrayNotification extends BaseNotification {
  data?: HMSPeer[];
}
interface TrackNotification extends BaseNotification {
  data?: HMSTrack;
}
interface MessageNotification extends BaseNotification {
  data?: HMSMessage;
}
interface ExceptionNotification extends BaseNotification {
  data?: HMSException;
}
interface ChangeTrackStateRequestNotification extends BaseNotification {
  data?: HMSChangeTrackStateRequest;
}
interface ChangeMultiTrackStateRequestNotification extends BaseNotification {
  data?: HMSChangeMultiTrackStateRequest;
}

interface LeaveRoomRequestNotification extends BaseNotification {
  data?: HMSLeaveRoomRequest;
}
interface DeviceChangeEventNotification extends BaseNotification {
  data?: HMSDeviceChangeEvent;
}
interface PlaylistItemNotification<T> extends BaseNotification {
  data?: HMSPlaylistItem<T>;
}

export type HMSNotification<T> =
  | PeerNotification
  | PeerArrayNotification[]
  | TrackNotification
  | MessageNotification
  | ExceptionNotification
  | ChangeTrackStateRequestNotification
  | ChangeMultiTrackStateRequestNotification
  | LeaveRoomRequestNotification
  | DeviceChangeEventNotification
  | PlaylistItemNotification<T>
  | null;

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
