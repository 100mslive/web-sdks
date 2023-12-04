import { HMSUpdateListener } from '../../interfaces';
import { Store } from '../../sdk/store';
import { HMSNotificationMethod } from '../HMSNotificationMethod';
import { WhiteboardInfo } from '../HMSNotifications';

export class WhiteboardManager {
  constructor(private store: Store, public listener?: HMSUpdateListener) {}

  handleNotification(method: string, notification: any) {
    switch (method) {
      case HMSNotificationMethod.WHITEBOARD_UPDATE: {
        this.handleWhiteboardUpdate(notification as WhiteboardInfo);
        break;
      }
      default:
        break;
    }
  }

  private handleWhiteboardUpdate(notification: WhiteboardInfo) {
    const localPeerID = this.store.getLocalPeer()?.peerId;
    if (notification.owner === localPeerID) {
      return;
    }
    this.store.setWhiteboard(notification);
    this.listener?.onWhiteboardUpdate(notification);
  }
}
