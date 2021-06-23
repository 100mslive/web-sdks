import { IHMSNotifications } from '../IHMSNotifications';
import { IHMSStore } from '../IHMSStore';
import { selectPeerByID, selectTrackByID } from '../selectors';
import * as sdkTypes from './sdkTypes';
import { PEER_NOTIFICATION_TYPES, TRACK_NOTIFICATION_TYPES } from './common/mapping';
import {
  HMSNotification,
  HMSSeverity,
  HMSNotificationTypes,
  HMSNoticiationSeverity,
  HMSPeer,
} from '../schema';
import { getEventTarget, HMSNotificationCallback } from './EventTargetPolyfill';

const HMS_NOTIFICATION_EVENT = 'hmsNotification';

export class HMSNotifications implements IHMSNotifications {
  private id: number = 0;
  private eventTarget: EventTarget;
  private store: IHMSStore;

  constructor(store: IHMSStore) {
    this.store = store;
    const EventTargetPolyfilled = getEventTarget();
    this.eventTarget = new EventTargetPolyfilled();
  }

  onNotification = (cb: (notification: HMSNotification) => void): (() => void) => {
    const listener: HMSNotificationCallback = (e: any) => {
      cb(e.detail as HMSNotification);
    };
    this.eventTarget.addEventListener(HMS_NOTIFICATION_EVENT, listener);
    return () => {
      this.eventTarget.removeEventListener(HMS_NOTIFICATION_EVENT, listener);
    };
  };

  sendPeerUpdate(type: sdkTypes.HMSPeerUpdate, peer: HMSPeer | null) {
    let hmsPeer = this.store.getState(selectPeerByID(peer?.id)) || peer;
    const notificationType = PEER_NOTIFICATION_TYPES[type];
    if (notificationType) {
      const notification = this.createNotification(
        notificationType,
        hmsPeer,
        HMSNoticiationSeverity.INFO as HMSSeverity,
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
        HMSNoticiationSeverity.INFO as HMSSeverity,
      );
      this.emitEvent(notification);
    }
  }

  sendMessageReceived(message: any) {
    const notification = this.createNotification(
      HMSNotificationTypes.NEW_MESSAGE,
      message,
      HMSNoticiationSeverity.INFO as HMSSeverity,
    );
    this.emitEvent(notification);
  }

  sendError(error: any) {
    const notification = this.createNotification(
      HMSNotificationTypes.ERROR,
      error,
      HMSNoticiationSeverity.ERROR as HMSSeverity,
    );
    this.emitEvent(notification);
  }

  sendReconnecting(error: any) {
    const notification = this.createNotification(
      HMSNotificationTypes.RECONNECTING,
      error,
      HMSNoticiationSeverity.ERROR as HMSSeverity,
    );
    this.emitEvent(notification);
  }

  sendReconnected() {
    const notification = this.createNotification(
      HMSNotificationTypes.RECONNECTED,
      null,
      HMSNoticiationSeverity.INFO as HMSSeverity,
    );
    this.emitEvent(notification);
  }

  private emitEvent(notification: HMSNotification) {
    const event = new CustomEvent(HMS_NOTIFICATION_EVENT, { detail: notification });
    this.eventTarget.dispatchEvent(event);
  }

  private createNotification(
    type: string,
    data?: any,
    severity?: HMSSeverity,
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
