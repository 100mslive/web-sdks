import { HMSUpdateListener } from '../../interfaces';
import Message from '../../sdk/models/HMSMessage';
import { HMSPeer } from '../../sdk/models/peer';
import { IStore } from '../../sdk/store';
import HMSLogger from '../../utils/logger';
import { MessageNotification } from '../HMSNotifications';

export class BroadcastManager {
  constructor(private store: IStore, public listener?: HMSUpdateListener) {}

  private get TAG() {
    return `[${this.constructor.name}]`;
  }

  handleBroadcast(messageNotification: MessageNotification) {
    const notifPeer = messageNotification.peer;
    const notifMessage = messageNotification.info;
    const notifRoles = messageNotification.roles;
    // If sender peerId is available in store, use that peer.
    let sender = this.store.getPeerById(notifPeer.peer_id);
    // If not available in store, use peer data from received broadcast message from Biz
    if (!sender) {
      sender = new HMSPeer({
        peerId: notifPeer.peer_id,
        name: notifPeer.info.name,
        isLocal: false,
        customerUserId: notifPeer.info.user_id,
        customerDescription: notifPeer.info.data,
      });
    }

    let recipientPeer;
    const recipientRoles = [];

    if (notifRoles?.length) {
      const knownRoles = this.store.getKnownRoles();
      for (const role of notifRoles) {
        if (knownRoles[role]) {
          recipientRoles.push(knownRoles[role]);
        }
      }
    }

    if (messageNotification.private) {
      const peer = this.store.getLocalPeer();
      recipientPeer = peer;
    }

    const hmsMessage = new Message({
      ...notifMessage,
      sender,
      recipientRoles,
      recipientPeer,
      time: new Date(messageNotification.timestamp),
    });
    HMSLogger.d(this.TAG, `Received Message:: `, hmsMessage);
    this.listener?.onMessageReceived(hmsMessage);
  }
}
