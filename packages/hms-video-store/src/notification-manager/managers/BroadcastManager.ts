import { HMSUpdateListener } from '../../interfaces';
import HMSLogger from '../../utils/logger';
import { HMSNotificationMethod } from '../HMSNotificationMethod';
import { MessageNotification } from '../HMSNotifications';

export class BroadcastManager {
  private readonly TAG = '[BroadcastManager]';
  constructor(public listener?: HMSUpdateListener) {}

  handleNotification(method: string, notification: any) {
    if (method !== HMSNotificationMethod.BROADCAST) {
      return;
    }
    this.handleBroadcast(notification);
  }

  private handleBroadcast(messageNotification: MessageNotification) {
    HMSLogger.d(this.TAG, `Received Message from sender=${messageNotification?.peer?.peer_id}: ${messageNotification}`);
    this.listener?.onMessageReceived(messageNotification);
  }
}
