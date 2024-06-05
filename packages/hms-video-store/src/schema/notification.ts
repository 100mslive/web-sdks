import { HMSDeviceChangeEvent } from './device-change';
import { HMSException } from './error';
import { HMSMessage } from './message';
import { HMSPeer, HMSTrack } from './peer';
import { HMSPlaylistItem } from './playlist';
import { HMSChangeMultiTrackStateRequest, HMSChangeTrackStateRequest, HMSLeaveRoomRequest } from './requests';
import { HMSPoll, HMSTranscriptionInfo } from '../internal';

interface BaseNotification {
  id: number;
  type: string;
  message: string;
  severity?: HMSNotificationSeverity;
}
export interface HMSPeerNotification extends BaseNotification {
  type:
    | HMSNotificationTypes.PEER_JOINED
    | HMSNotificationTypes.PEER_LEFT
    | HMSNotificationTypes.NAME_UPDATED
    | HMSNotificationTypes.METADATA_UPDATED
    | HMSNotificationTypes.ROLE_UPDATED
    | HMSNotificationTypes.HAND_RAISE_CHANGED;
  data: HMSPeer;
}

export interface HMSPeerListNotification extends BaseNotification {
  type: HMSNotificationTypes.PEER_LIST;
  data: HMSPeer[];
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
  data: HMSTrack;
}
export interface HMSMessageNotification extends BaseNotification {
  type: HMSNotificationTypes.NEW_MESSAGE;
  data: HMSMessage;
}
export interface HMSExceptionNotification extends BaseNotification {
  type: HMSNotificationTypes.ERROR;
  data: HMSException;
}
export interface HMSChangeTrackStateRequestNotification extends BaseNotification {
  type: HMSNotificationTypes.CHANGE_TRACK_STATE_REQUEST;
  data: HMSChangeTrackStateRequest;
}
export interface HMSChangeMultiTrackStateRequestNotification extends BaseNotification {
  type: HMSNotificationTypes.CHANGE_MULTI_TRACK_STATE_REQUEST;
  data: HMSChangeMultiTrackStateRequest;
}

export interface HMSLeaveRoomRequestNotification extends BaseNotification {
  type: HMSNotificationTypes.ROOM_ENDED | HMSNotificationTypes.REMOVED_FROM_ROOM;
  data: HMSLeaveRoomRequest;
}
export interface HMSDeviceChangeEventNotification extends BaseNotification {
  type: HMSNotificationTypes.DEVICE_CHANGE_UPDATE;
  data?: HMSDeviceChangeEvent;
}
export interface HMSPlaylistItemNotification<T> extends BaseNotification {
  type: HMSNotificationTypes.PLAYLIST_TRACK_ENDED;
  data: HMSPlaylistItem<T>;
}

export interface HMSReconnectionNotification extends BaseNotification {
  type: HMSNotificationTypes.RECONNECTED | HMSNotificationTypes.RECONNECTING;
  data: HMSException | null;
}

export interface HMSPollNotification extends BaseNotification {
  type: HMSNotificationTypes.POLL_STARTED | HMSNotificationTypes.POLL_STOPPED | HMSNotificationTypes.POLL_VOTES_UPDATED;
  data: HMSPoll;
}

export interface HMSTranscriptionNotification extends BaseNotification {
  type: HMSNotificationTypes.TRANSCRIPTION_STATE_UPDATED;
  data: HMSTranscriptionInfo[];
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
  | HMSReconnectionNotification
  | HMSTranscriptionNotification
  | HMSPlaylistItemNotification<any>;

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
  POLL_CREATED = 'POLL_CREATED',
  POLL_STARTED = 'POLL_STARTED',
  POLL_STOPPED = 'POLL_STOPPED',
  POLL_VOTES_UPDATED = 'POLL_VOTES_UPDATED',
  POLLS_LIST = 'POLLS_LIST',
  HAND_RAISE_CHANGED = 'HAND_RAISE_CHANGED',
  TRANSCRIPTION_STATE_UPDATED = 'TRANSCRIPTION_STATE_UPDATED',
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
  [HMSNotificationTypes.PLAYLIST_TRACK_ENDED]: HMSPlaylistItemNotification<C>;
  [HMSNotificationTypes.ERROR]: HMSExceptionNotification;
  [HMSNotificationTypes.CHANGE_TRACK_STATE_REQUEST]: HMSChangeTrackStateRequestNotification;
  [HMSNotificationTypes.CHANGE_MULTI_TRACK_STATE_REQUEST]: HMSChangeMultiTrackStateRequestNotification;
  [HMSNotificationTypes.RECONNECTED]: HMSReconnectionNotification;
  [HMSNotificationTypes.RECONNECTING]: HMSReconnectionNotification;
  [HMSNotificationTypes.POLL_STARTED]: HMSPollNotification;
  [HMSNotificationTypes.POLL_STOPPED]: HMSPollNotification;
  [HMSNotificationTypes.POLL_VOTES_UPDATED]: HMSPollNotification;
  [HMSNotificationTypes.POLLS_LIST]: HMSPollNotification;
  [HMSNotificationTypes.POLL_CREATED]: HMSPollNotification;
  [HMSNotificationTypes.HAND_RAISE_CHANGED]: HMSPeerNotification;
  [HMSNotificationTypes.TRANSCRIPTION_STATE_UPDATED]: HMSTranscriptionNotification;
}[T];

export type MappedNotifications<Type extends HMSNotificationTypes[]> = {
  [index in keyof Type]: HMSNotificationMapping<Type[index]>;
};

export type HMSNotificationTypeParam = HMSNotificationTypes | HMSNotificationTypes[] | undefined;

export type HMSNotificationInCallback<T extends HMSNotificationTypeParam> = T extends HMSNotificationTypes[]
  ? MappedNotifications<T>[number]
  : T extends HMSNotificationTypes
  ? HMSNotificationMapping<T>
  : HMSNotification;

export type HMSNotificationCallback<T extends HMSNotificationTypeParam> = (
  notification: HMSNotificationInCallback<T>,
) => void;

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
  onNotification<T extends HMSNotificationTypeParam>(cb: HMSNotificationCallback<T>, types?: T): () => void;
}
