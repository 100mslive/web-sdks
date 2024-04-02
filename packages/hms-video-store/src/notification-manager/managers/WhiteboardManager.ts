import { HMSUpdateListener, HMSWhiteboard } from '../../interfaces';
import { Store } from '../../sdk/store';
import HMSTransport from '../../transport';
import { constructWhiteboardURL } from '../../utils/whiteboard';
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
    const prev = this.store.getWhiteboard(notification.id);
    const isOwner = notification.owner === localPeer?.peerId || notification.owner === localPeer?.customerUserId;
    const open = notification.state === 'open';
    const whiteboard: HMSWhiteboard = {
      id: notification.id,
      title: notification.title,
      attributes: notification.attributes,
    };
    whiteboard.open = isOwner ? prev?.open : open;
    whiteboard.owner = whiteboard.open ? notification.owner : undefined;

    if (whiteboard.open) {
      if (isOwner) {
        whiteboard.url = prev?.url;
        whiteboard.token = prev?.token;
        whiteboard.addr = prev?.addr;
        whiteboard.permissions = prev?.permissions;
      } else {
        const response = await this.transport.signal.getWhiteboard({ id: notification.id });
        whiteboard.url = constructWhiteboardURL(response.token, response.addr, this.store.getEnv());
        whiteboard.token = response.token;
        whiteboard.addr = response.addr;
        whiteboard.permissions = response.permissions;
      }
    }

    this.store.setWhiteboard(whiteboard);
    this.listener?.onWhiteboardUpdate(whiteboard);
  }
}
