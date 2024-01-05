import { createRemotePeer } from './utils';
import { HMSUpdateListener } from '../../interfaces';
import Message from '../../sdk/models/HMSMessage';
import { Store } from '../../sdk/store';
import HMSLogger from '../../utils/logger';
import { HMSNotificationMethod } from '../HMSNotificationMethod';
import { MessageNotification } from '../HMSNotifications';

export class BroadcastManager {
  private readonly TAG = '[BroadcastManager]';
  constructor(private store: Store, public listener?: HMSUpdateListener) {}

  handleNotification(method: string, notification: any) {
    if (method !== HMSNotificationMethod.BROADCAST) {
      return;
    }
    this.handleBroadcast(notification);
  }

  private handleBroadcast(messageNotification: MessageNotification) {
    const notifPeer = messageNotification.peer;
    const notifMessage = messageNotification.info;
    const notifRoles = messageNotification.roles;

    const sender = this.getSender(notifPeer);
    const recipientPeer = messageNotification.private ? this.store.getLocalPeer() : undefined;
    const recipientRoles = [];

    if (notifRoles?.length) {
      const knownRoles = this.store.getKnownRoles();
      for (const role of notifRoles) {
        knownRoles[role] && recipientRoles.push(knownRoles[role]);
      }
    }

    const hmsMessage = new Message({
      ...notifMessage,
      sender,
      recipientRoles,
      recipientPeer,
      time: new Date(messageNotification.timestamp),
      id: messageNotification.message_id,
    });
    HMSLogger.d(this.TAG, `Received Message from sender=${notifPeer?.peer_id}: ${hmsMessage}`);
    this.listener?.onMessageReceived(hmsMessage);
  }

  private getSender(notifPeer?: MessageNotification['peer']) {
    // If sender peerId is available in store, use that peer.
    let sender = notifPeer ? this.store.getPeerById(notifPeer.peer_id) : undefined;
    // If not available in store, use peer data from received broadcast message from Biz
    // notifPeer can be undefined when message is sent via api
    if (!sender && notifPeer) {
      sender = createRemotePeer(notifPeer, this.store);
    }
    return sender;
  }
}