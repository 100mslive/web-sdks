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

export interface HMSPeerArrayNotification extends BaseNotification {
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

export type HMSNotification =
  | HMSPeerNotification
  | HMSPeerArrayNotification
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

export type HMSPeerNotificationCallback = (notification: HMSPeerNotification) => void;
export type HMSPeerArrayNotificationCallback = (notification: HMSPeerArrayNotification) => void;
export type HMSTrackNotificationCallback = (notification: HMSTrackNotification) => void;
export type HMSExceptionNotificationCallback = (notification: HMSExceptionNotification) => void;
export type HMSMessageNotificationCallback = (notification: HMSMessageNotification) => void;
export type HMSChangeTrackReqNotificationCallback = (notification: HMSChangeTrackStateRequestNotification) => void;
export type HMSChangeMultiTrackReqNotificationCallback = (
  notification: HMSChangeMultiTrackStateRequestNotification,
) => void;
export type HMSLeaveRoomRequestNotificationCallback = (notification: HMSLeaveRoomRequestNotification) => void;
export type HMSDeviceChangeNotificationCallback = (notificaiton: HMSDeviceChangeEventNotification) => void;
export type HMSPlaylistItemNotificationCallback<T> = (notification: HMSPlaylistItemNotification<T>) => void;

export type HMSNotificationCallback =
  | HMSPeerNotificationCallback
  | HMSPeerArrayNotificationCallback
  | HMSTrackNotificationCallback
  | HMSExceptionNotificationCallback
  | HMSMessageNotificationCallback
  | HMSChangeTrackReqNotificationCallback
  | HMSChangeMultiTrackReqNotificationCallback
  | HMSLeaveRoomRequestNotificationCallback
  | HMSDeviceChangeNotificationCallback
  | HMSPlaylistItemNotificationCallback<any>
  | null;

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
  onNotification(cb: HMSNotificationCallback, type?: HMSNotificationTypes | HMSNotificationTypes[]): () => void;
  onNotification(
    cb: HMSPeerNotificationCallback,
    type?: HMSNotificationTypes.PEER_JOINED | HMSNotificationTypes.PEER_LEFT,
  ): () => void;
  onNotification(cb: HMSPeerArrayNotificationCallback, type?: HMSNotificationTypes.PEER_LIST): () => void;
  onNotification(
    cb: HMSTrackNotificationCallback,
    type?:
      | HMSNotificationTypes.TRACK_ADDED
      | HMSNotificationTypes.TRACK_DEGRADED
      | HMSNotificationTypes.TRACK_UNMUTED
      | HMSNotificationTypes.TRACK_DESCRIPTION_CHANGED
      | HMSNotificationTypes.TRACK_MUTED
      | HMSNotificationTypes.TRACK_REMOVED
      | HMSNotificationTypes.TRACK_RESTORED,
  ): () => void;
  onNotification(cb: HMSExceptionNotificationCallback, type?: HMSNotificationTypes.ERROR): () => void;
  onNotification(cb: HMSMessageNotificationCallback, type?: HMSNotificationTypes.NEW_MESSAGE): () => void;
  onNotification(
    cb: HMSChangeTrackReqNotificationCallback,
    type?: HMSNotificationTypes.CHANGE_TRACK_STATE_REQUEST,
  ): () => void;
  onNotification(
    cb: HMSChangeTrackReqNotificationCallback,
    type?: HMSNotificationTypes.CHANGE_MULTI_TRACK_STATE_REQUEST,
  ): () => void;
  onNotification(
    cb: HMSLeaveRoomRequestNotificationCallback,
    type?: HMSNotificationTypes.ROOM_ENDED | HMSNotificationTypes.REMOVED_FROM_ROOM,
  ): () => void;
  onNotification(cb: HMSDeviceChangeNotificationCallback, type?: HMSNotificationTypes.DEVICE_CHANGE_UPDATE): () => void;
  onNotification(
    cb: HMSPlaylistItemNotificationCallback<any>,
    type?: HMSNotificationTypes.PLAYLIST_TRACK_ENDED,
  ): () => void;
}
