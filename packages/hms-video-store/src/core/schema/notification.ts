import { HMSPeer, HMSTrack } from './peer';
import { HMSMessage } from './message';
import { HMSChangeMultiTrackStateRequest, HMSChangeTrackStateRequest, HMSLeaveRoomRequest } from './requests';
import { HMSDeviceChangeEvent } from './device-change';
import { HMSPlaylistItem } from './playlist';
import { HMSException } from './error';

interface BaseNotification {
  id: number;
  type: string;
  message: string;
  severity?: HMSNotificationSeverity;
}
export interface HMSPeerNotification extends BaseNotification {
  type: HMSNotificationTypes.PEER_JOINED | HMSNotificationTypes.PEER_LEFT;
  data?: HMSPeer;
}

export interface HMSPeerListNotification extends BaseNotification {
  type: HMSNotificationTypes.PEER_LIST;
  data?: HMSPeer[];
}
export interface HMSTrackNotification extends BaseNotification {
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
export interface HMSMessageNotification extends BaseNotification {
  type: HMSNotificationTypes.NEW_MESSAGE;
  data?: HMSMessage;
}
export interface HMSExceptionNotification extends BaseNotification {
  type: HMSNotificationTypes.ERROR;
  data?: HMSException;
}
export interface HMSChangeTrackStateRequestNotification extends BaseNotification {
  type: HMSNotificationTypes.CHANGE_TRACK_STATE_REQUEST;
  data?: HMSChangeTrackStateRequest;
}
export interface HMSChangeMultiTrackStateRequestNotification extends BaseNotification {
  type: HMSNotificationTypes.CHANGE_MULTI_TRACK_STATE_REQUEST;
  data?: HMSChangeMultiTrackStateRequest;
}

export interface HMSLeaveRoomRequestNotification extends BaseNotification {
  type: HMSNotificationTypes.ROOM_ENDED | HMSNotificationTypes.REMOVED_FROM_ROOM;
  data?: HMSLeaveRoomRequest;
}
export interface HMSDeviceChangeEventNotification extends BaseNotification {
  type: HMSNotificationTypes.DEVICE_CHANGE_UPDATE;
  data?: HMSDeviceChangeEvent;
}
export interface HMSPlaylistItemNotification<T> extends BaseNotification {
  type: HMSNotificationTypes.PLAYLIST_TRACK_ENDED;
  data?: HMSPlaylistItem<T>;
}

export interface HMSReconnectionNotification extends BaseNotification {
  type: HMSNotificationTypes.RECONNECTED | HMSNotificationTypes.RECONNECTING;
  data: null;
}

export type HMSNotification =
  | HMSPeerNotification
  | HMSPeerListNotification
  | HMSTrackNotification
  | HMSMessageNotification
  | HMSExceptionNotification
  | HMSChangeTrackStateRequestNotification
  | HMSChangeMultiTrackStateRequestNotification
  | HMSLeaveRoomRequestNotification
  | HMSDeviceChangeEventNotification
  | HMSPlaylistItemNotification<any>
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

export type HMSNotificationMapping<T extends HMSNotificationTypes, C = any> = {
  [HMSNotificationTypes.PEER_JOINED]: HMSPeerNotification;
  [HMSNotificationTypes.PEER_LEFT]: HMSPeerNotification;
  [HMSNotificationTypes.PEER_LIST]: HMSPeerListNotification;
  [HMSNotificationTypes.NAME_UPDATED]: HMSPeerNotification;
  [HMSNotificationTypes.METADATA_UPDATED]: HMSPeerNotification;
  [HMSNotificationTypes.ROLE_UPDATED]: HMSPeerNotification;
  [HMSNotificationTypes.TRACK_ADDED]: HMSTrackNotification;
  [HMSNotificationTypes.TRACK_REMOVED]: HMSTrackNotification;
  [HMSNotificationTypes.TRACK_MUTED]: HMSTrackNotification;
  [HMSNotificationTypes.TRACK_UNMUTED]: HMSTrackNotification;
  [HMSNotificationTypes.TRACK_DEGRADED]: HMSTrackNotification;
  [HMSNotificationTypes.TRACK_RESTORED]: HMSTrackNotification;
  [HMSNotificationTypes.TRACK_DESCRIPTION_CHANGED]: HMSTrackNotification;
  [HMSNotificationTypes.TRACK_UNMUTED]: HMSTrackNotification;
  [HMSNotificationTypes.NEW_MESSAGE]: HMSMessageNotification;
  [HMSNotificationTypes.ROOM_ENDED]: HMSLeaveRoomRequestNotification;
  [HMSNotificationTypes.REMOVED_FROM_ROOM]: HMSLeaveRoomRequestNotification;
  [HMSNotificationTypes.DEVICE_CHANGE_UPDATE]: HMSDeviceChangeEventNotification;
  [HMSNotificationTypes.PLAYLIST_TRACK_ENDED]: HMSPlaylistItem<C>;
  [HMSNotificationTypes.ERROR]: HMSExceptionNotification;
  [HMSNotificationTypes.CHANGE_TRACK_STATE_REQUEST]: HMSChangeTrackStateRequestNotification;
  [HMSNotificationTypes.CHANGE_MULTI_TRACK_STATE_REQUEST]: HMSChangeMultiTrackStateRequestNotification;
  [HMSNotificationTypes.RECONNECTED]: HMSReconnectionNotification;
  [HMSNotificationTypes.RECONNECTING]: HMSReconnectionNotification;
}[T];

export type HMSNotificationCallback<T extends HMSNotificationTypes> = (notification: HMSNotificationMapping<T>) => void;

/**
 * @category Core
 */
export interface IHMSNotifications {
  /**
   * you can subscribe to notifications for new message, peer add etc. using this function.
   * note that this is not meant to maintain any state on your side, as the reactive store already
   * does that. The intent of this function is mainly to display toast notifications or send analytics.
   * We'll provide a display message which can be displayed as it is for common cases.
   */
  onNotification<T extends HMSNotificationTypes>(cb: HMSNotificationCallback<T>, types?: T | T[]): () => void;
}
