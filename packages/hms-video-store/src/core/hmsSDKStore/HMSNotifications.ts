import { EventEmitter2 as EventEmitter } from 'eventemitter2';
import { PEER_NOTIFICATION_TYPES, TRACK_NOTIFICATION_TYPES } from './common/mapping';
import * as sdkTypes from './sdkTypes';
import { IHMSStore } from '../IHMSStore';
import {
  HMSChangeMultiTrackStateRequest,
  HMSChangeTrackStateRequest,
  HMSDeviceChangeEvent,
  HMSException,
  HMSGenericTypes,
  HMSLeaveRoomRequest,
  HMSMessage,
  HMSNotification,
  HMSNotificationSeverity,
  HMSNotificationTypes,
  HMSPeer,
  HMSPlaylistItem,
  HMSTrack,
  HMSTrackID,
} from '../schema';
import {
  HMSNotificationCallback,
  HMSNotificationInCallback,
  HMSNotificationTypeParam,
  IHMSNotifications,
} from '../schema/notification';
import { selectPeerByID, selectTrackByID } from '../selectors';

const HMS_NOTIFICATION_EVENT = 'hmsNotification';

export class HMSNotifications<T extends HMSGenericTypes = { sessionStore: Record<string, any> }>
  implements IHMSNotifications
{
  private id = 0;
  private eventEmitter: EventEmitter;
  private store: IHMSStore<T>;

  constructor(store: IHMSStore<T>) {
    this.store = store;
    this.eventEmitter = new EventEmitter({ maxListeners: Object.keys(HMSNotificationTypes).length });
  }
  onNotification = <T extends HMSNotificationTypeParam>(cb: HMSNotificationCallback<T>, type?: T) => {
    const eventCallback = (notification: HMSNotificationInCallback<T>) => {
      if (type) {
        let matchesType: boolean;
        if (Array.isArray(type)) {
          matchesType = type.includes(notification.type as HMSNotificationTypes);
        } else {
          matchesType = type === notification.type;
        }
        if (!matchesType) {
          return;
        }
      }
      cb(notification);
    };
    this.eventEmitter.addListener(HMS_NOTIFICATION_EVENT, eventCallback);
    return () => {
      this.eventEmitter.removeListener(HMS_NOTIFICATION_EVENT, eventCallback);
    };
  };

  sendPlaylistTrackEnded<T>(item: HMSPlaylistItem<T>): void {
    const notification = this.createNotification(
      HMSNotificationTypes.PLAYLIST_TRACK_ENDED,
      item,
      HMSNotificationSeverity.INFO,
    );
    this.emitEvent(notification);
  }

  sendDeviceChange(request: HMSDeviceChangeEvent) {
    const notification = this.createNotification(
      HMSNotificationTypes.DEVICE_CHANGE_UPDATE,
      request,
      request.error ? HMSNotificationSeverity.ERROR : HMSNotificationSeverity.INFO,
      `Selected ${request.type} device - ${request.selection?.label}`,
    );
    this.emitEvent(notification);
  }

  sendLeaveRoom(request: HMSLeaveRoomRequest) {
    const peerName = request.requestedBy?.name;
    const notification = this.createNotification(
      request.roomEnded || !peerName ? HMSNotificationTypes.ROOM_ENDED : HMSNotificationTypes.REMOVED_FROM_ROOM,
      request,
      HMSNotificationSeverity.INFO,
      `${request.roomEnded ? `Room ended` : 'Removed from room'} ${peerName ? `by ${peerName}` : ''}`,
    );
    this.emitEvent(notification);
  }

  sendPeerList(peers: HMSPeer[]) {
    const notification = this.createNotification(HMSNotificationTypes.PEER_LIST, peers, HMSNotificationSeverity.INFO);
    this.emitEvent(notification);
  }

  sendPeerUpdate(type: sdkTypes.HMSPeerUpdate, peer: HMSPeer | null) {
    const hmsPeer = this.store.getState(selectPeerByID(peer?.id)) || peer;
    const notificationType = PEER_NOTIFICATION_TYPES[type];
    if (notificationType) {
      const notification = this.createNotification(notificationType, hmsPeer, HMSNotificationSeverity.INFO);
      this.emitEvent(notification);
    }
  }

  sendTrackUpdate(type: sdkTypes.HMSTrackUpdate, trackID: HMSTrackID) {
    const hmsTrack = this.store.getState(selectTrackByID(trackID));
    const notificationType = TRACK_NOTIFICATION_TYPES[type];
    if (notificationType) {
      const notification = this.createNotification(notificationType, hmsTrack, HMSNotificationSeverity.INFO);
      this.emitEvent(notification);
    }
  }

  sendMessageReceived(message: HMSMessage) {
    const notification = this.createNotification(
      HMSNotificationTypes.NEW_MESSAGE,
      message,
      HMSNotificationSeverity.INFO,
    );
    this.emitEvent(notification);
  }

  sendError(error: HMSException) {
    const notification = this.createNotification(HMSNotificationTypes.ERROR, error, HMSNotificationSeverity.ERROR);
    this.emitEvent(notification);
  }

  sendReconnecting(error: HMSException) {
    const notification = this.createNotification(
      HMSNotificationTypes.RECONNECTING,
      error,
      HMSNotificationSeverity.ERROR,
    );
    this.emitEvent(notification);
  }

  sendReconnected() {
    const notification = this.createNotification(HMSNotificationTypes.RECONNECTED, null, HMSNotificationSeverity.INFO);
    this.emitEvent(notification);
  }

  sendChangeTrackStateRequest(request: HMSChangeTrackStateRequest) {
    const notification = this.createNotification(
      HMSNotificationTypes.CHANGE_TRACK_STATE_REQUEST,
      request,
      HMSNotificationSeverity.INFO,
    );
    this.emitEvent(notification);
  }

  sendChangeMultiTrackStateRequest(request: HMSChangeMultiTrackStateRequest) {
    const notification = this.createNotification(
      HMSNotificationTypes.CHANGE_MULTI_TRACK_STATE_REQUEST,
      request,
      HMSNotificationSeverity.INFO,
    );
    this.emitEvent(notification);
  }

  private emitEvent(notification: HMSNotification) {
    this.eventEmitter.emit(HMS_NOTIFICATION_EVENT, notification);
  }

  private createNotification<T>(
    type: HMSNotificationTypes,
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
      | null,
    severity?: HMSNotificationSeverity,
    message = '',
  ): HMSNotification {
    this.id++;
    return {
      id: this.id,
      type,
      message,
      data,
      severity,
    } as HMSNotification;
  }
}
