import { HMSUpdateListener, HMSWhiteboard } from '../../interfaces';
import { Store } from '../../sdk/store';
import HMSTransport from '../../transport';
import { HMSNotificationMethod } from '../HMSNotificationMethod';
import { WhiteboardInfo } from '../HMSNotifications';

export class WhiteboardManager {
  constructor(private store: Store, private transport: HMSTransport, public listener?: HMSUpdateListener) {}

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

  private async handleWhiteboardUpdate(notification: WhiteboardInfo) {
    const localPeer = this.store.getLocalPeer();
    if (notification.owner === localPeer?.peerId || notification.owner === localPeer?.customerUserId) {
      return;
    }
    const prev = this.store.getWhiteboard(notification.id);
    const open = notification.state === 'open';
    let whiteboard: HMSWhiteboard;
    if (open) {
      const response = await this.transport.signal.getWhiteboard({ id: notification.id });
      whiteboard = {
        ...prev,
        open,
        id: notification.id,
        title: notification.title,
        owner: notification.owner,
        attributes: notification.attributes,
        token: response.token,
        addr: response.addr,
        permissions: response.permissions || [],
      };
    } else {
      whiteboard = { id: notification.id, title: notification.title, open };
    }

    this.store.setWhiteboard(whiteboard);
    this.listener?.onWhiteboardUpdate(whiteboard);
  }
}
