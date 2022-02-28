import { EventEmitter2 as EventEmitter } from 'eventemitter2';
import { IHMSNotifications, HMSNotificationCallback } from '../IHMSNotifications';
import { IHMSStore } from '../IHMSStore';
import { selectPeerByID, selectTrackByID } from '../selectors';
import * as sdkTypes from './sdkTypes';
import { PEER_NOTIFICATION_TYPES, TRACK_NOTIFICATION_TYPES } from './common/mapping';
import {
  HMSNotification,
  HMSNotificationTypes,
  HMSNotificationSeverity,
  HMSPeer,
  HMSException,
  HMSMessage,
  HMSTrack,
  HMSTrackID,
  HMSChangeTrackStateRequest,
  HMSChangeMultiTrackStateRequest,
  HMSLeaveRoomRequest,
  HMSDeviceChangeEvent,
  HMSPlaylistItem,
} from '../schema';

const HMS_NOTIFICATION_EVENT = 'hmsNotification';

export class HMSNotifications implements IHMSNotifications {
  private id = 0;
  private eventEmitter: EventEmitter;
  private store: IHMSStore;

  constructor(store: IHMSStore) {
    this.store = store;
    this.eventEmitter = new EventEmitter();
  }

  onNotification = (cb: HMSNotificationCallback, type?: HMSNotificationTypes | HMSNotificationTypes[]) => {
    const eventCallback = (notification: HMSNotification) => {
      if (type) {
        let matchesType: boolean;
        if (Array.isArray(type)) {
          matchesType = type.includes(notification.type as HMSNotificationTypes);
        } else {
          matchesType = type === (notification.type as HMSNotificationTypes);
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
    type: string,
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
    };
  }
}
