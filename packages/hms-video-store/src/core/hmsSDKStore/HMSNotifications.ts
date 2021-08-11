import EventEmitter from 'events';
import { IHMSNotifications } from '../IHMSNotifications';
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
  HMSChangeTrackStateRequest,
} from '../schema';

const HMS_NOTIFICATION_EVENT = 'hmsNotification';
export class HMSNotifications implements IHMSNotifications {
  private id: number = 0;
  private eventEmitter: EventEmitter;
  private store: IHMSStore;

  constructor(store: IHMSStore) {
    this.store = store;
    this.eventEmitter = new EventEmitter();
  }

  onNotification = (cb: (notification: HMSNotification) => void): (() => void) => {
    this.eventEmitter.addListener(HMS_NOTIFICATION_EVENT, cb);
    return () => {
      this.eventEmitter.removeListener(HMS_NOTIFICATION_EVENT, cb);
    };
  };

  sendPeerUpdate(type: sdkTypes.HMSPeerUpdate, peer: HMSPeer | null) {
    let hmsPeer = this.store.getState(selectPeerByID(peer?.id)) || peer;
    const notificationType = PEER_NOTIFICATION_TYPES[type];
    if (notificationType) {
      const notification = this.createNotification(
        notificationType,
        hmsPeer,
        HMSNotificationSeverity.INFO,
      );
      this.emitEvent(notification);
    }
  }

  sendTrackUpdate(type: sdkTypes.HMSTrackUpdate, trackID: string) {
    const hmsTrack = this.store.getState(selectTrackByID(trackID));
    const notificationType = TRACK_NOTIFICATION_TYPES[type];
    if (notificationType) {
      const notification = this.createNotification(
        notificationType,
        hmsTrack,
        HMSNotificationSeverity.INFO,
      );
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
    const notification = this.createNotification(
      HMSNotificationTypes.ERROR,
      error,
      HMSNotificationSeverity.ERROR,
    );
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
    const notification = this.createNotification(
      HMSNotificationTypes.RECONNECTED,
      null,
      HMSNotificationSeverity.INFO,
    );
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

  private emitEvent(notification: HMSNotification) {
    this.eventEmitter.emit(HMS_NOTIFICATION_EVENT, notification);
  }

  private createNotification(
    type: string,
    data?: HMSPeer | HMSTrack | HMSMessage | HMSException | HMSChangeTrackStateRequest | null,
    severity?: HMSNotificationSeverity,
    message: string = '',
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
