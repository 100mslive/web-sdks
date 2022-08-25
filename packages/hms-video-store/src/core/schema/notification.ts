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
  type: HMSNotificationTypes.PEER_JOINED | HMSNotificationTypes.PEER_LEFT;
  data?: HMSPeer;
}

interface PeerArrayNotification extends BaseNotification {
  type: HMSNotificationTypes.PEER_LIST;
  data?: HMSPeer[];
}
interface TrackNotification extends BaseNotification {
  type:
    | HMSNotificationTypes.TRACK_ADDED
    | HMSNotificationTypes.TRACK_DEGRADED
    | HMSNotificationTypes.TRACK_UNMUTED
    | HMSNotificationTypes.TRACK_DESCRIPTION_CHANGED
    | HMSNotificationTypes.TRACK_MUTED
    | HMSNotificationTypes.TRACK_REMOVED
    | HMSNotificationTypes.TRACK_RESTORED;
  data?: HMSTrack;
}
interface MessageNotification extends BaseNotification {
  type: HMSNotificationTypes.NEW_MESSAGE;
  data?: HMSMessage;
}
interface ExceptionNotification extends BaseNotification {
  type: HMSNotificationTypes.ERROR;
  data?: HMSException;
}
interface ChangeTrackStateRequestNotification extends BaseNotification {
  type: HMSNotificationTypes.CHANGE_TRACK_STATE_REQUEST;
  data?: HMSChangeTrackStateRequest;
}
interface ChangeMultiTrackStateRequestNotification extends BaseNotification {
  type: HMSNotificationTypes.CHANGE_MULTI_TRACK_STATE_REQUEST;
  data?: HMSChangeMultiTrackStateRequest;
}

interface LeaveRoomRequestNotification extends BaseNotification {
  type: HMSNotificationTypes.ROOM_ENDED | HMSNotificationTypes.REMOVED_FROM_ROOM;
  data?: HMSLeaveRoomRequest;
}
interface DeviceChangeEventNotification extends BaseNotification {
  type: HMSNotificationTypes.DEVICE_CHANGE_UPDATE;
  data?: HMSDeviceChangeEvent;
}
interface PlaylistItemNotification<T> extends BaseNotification {
  type: HMSNotificationTypes.PLAYLIST_TRACK_ENDED;
  data?: HMSPlaylistItem<T>;
}

export type HMSNotification =
  | PeerNotification
  | PeerArrayNotification
  | TrackNotification
  | MessageNotification
  | ExceptionNotification
  | ChangeTrackStateRequestNotification
  | ChangeMultiTrackStateRequestNotification
  | LeaveRoomRequestNotification
  | DeviceChangeEventNotification
  | PlaylistItemNotification<any>
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
