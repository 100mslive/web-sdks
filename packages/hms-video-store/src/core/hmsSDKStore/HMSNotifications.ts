import { IHMSNotifications } from '../IHMSNotifications';
import { IHMSStore } from '../IHMSStore';
import { selectPeerByID } from '../selectors';
import * as sdkTypes from './sdkTypes';
import { PEER_NOTIFICATION_TYPES } from './common/mapping';
import { HMSNotification, HMSNotificationTypes } from '../schema';

const HMS_NOTIFICATION_EVENT = 'hmsNotification';

export class HMSNotifications implements IHMSNotifications {
  private id: number = 0;
  private eventTarget: EventTarget;
  private store: IHMSStore;

  constructor(store: IHMSStore) {
    this.store = store;
    this.eventTarget = new EventTarget();
  }

  onNotification = (cb: (notification: HMSNotification) => void): (() => void) => {
    const listener = (e: any) => {
      cb(e.detail as HMSNotification);
    };
    this.eventTarget.addEventListener(HMS_NOTIFICATION_EVENT, listener);
    return () => {
      this.eventTarget.removeEventListener(HMS_NOTIFICATION_EVENT, listener);
    };
  };

  sendPeerUpdate(type: sdkTypes.HMSPeerUpdate, peer: sdkTypes.HMSPeer) {
    const hmsPeer = this.store.getState(selectPeerByID(peer.peerId));
    const notificationType = PEER_NOTIFICATION_TYPES[type];
    if (notificationType) {
      const notification = this.createNotification(PEER_NOTIFICATION_TYPES[type], '', hmsPeer);
      this.emitEvent(notification);
    }
  }

  sendMessageReceived(message: any) {
    const notification = this.createNotification(HMSNotificationTypes.NEW_MESSAGE, '', message);
    this.emitEvent(notification);
  }

  sendError(error: any) {
    const notification = this.createNotification(HMSNotificationTypes.ERROR, '', error);
    this.emitEvent(notification);
  }

  private emitEvent(notification: HMSNotification) {
    const event = new CustomEvent(HMS_NOTIFICATION_EVENT, { detail: notification });
    this.eventTarget.dispatchEvent(event);
  }

  private createNotification(type: string, message: string, data?: any): HMSNotification {
    this.id++;
    return {
      id: this.id,
      type,
      message,
      data,
    };
  }
}
