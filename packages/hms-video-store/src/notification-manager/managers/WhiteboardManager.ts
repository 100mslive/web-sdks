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
    const prev = this.store.getWhiteboard(notification.id);
    const isOwner = this.isOwnedLocally(notification, prev);
    const whiteboard = this.buildWhiteboard(notification, prev, isOwner);

    if (whiteboard.open) {
      if (isOwner) {
        Object.assign(whiteboard, this.reuseLocalAccess(prev));
      } else {
        Object.assign(whiteboard, await this.fetchAccess(notification.id));
      }
    }

    this.store.setWhiteboard(whiteboard);
    this.listener?.onWhiteboardUpdate(whiteboard);
  }

  /**
   * `owner` is a customerUserId, which duplicate tabs of the same user share, so it can't identify
   * this client alone - only prior local state proves we're the peer that opened the whiteboard.
   */
  private isOwnedLocally(notification: WhiteboardInfo, prev?: HMSWhiteboard) {
    if (!prev) {
      return false;
    }
    const localPeer = this.store.getLocalPeer();
    return notification.owner === localPeer?.peerId || notification.owner === localPeer?.customerUserId;
  }

  private buildWhiteboard(notification: WhiteboardInfo, prev: HMSWhiteboard | undefined, isOwner: boolean) {
    // The owner's local state wins, so a remote update can't reopen a board it just closed.
    const open = isOwner ? prev?.open : notification.state === 'open';
    return {
      id: notification.id,
      title: notification.title,
      attributes: notification.attributes,
      open,
      owner: open ? notification.owner : undefined,
    } as HMSWhiteboard;
  }

  private reuseLocalAccess(prev?: HMSWhiteboard) {
    return { url: prev?.url, token: prev?.token, addr: prev?.addr, permissions: prev?.permissions };
  }

  private async fetchAccess(id: string) {
    const response = await this.transport.signal.getWhiteboard({ id });
    return {
      url: constructWhiteboardURL(response.token, response.addr, this.store.getEnv()),
      token: response.token,
      addr: response.addr,
      permissions: response.permissions,
      open: response.permissions.length > 0,
    };
  }
}
