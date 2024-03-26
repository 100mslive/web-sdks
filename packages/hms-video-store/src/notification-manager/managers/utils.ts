import { HMSRemotePeer } from '../../sdk/models/peer';
import { Store } from '../../sdk/store';
import { PeerNotificationInfo } from '../HMSNotifications';

export const createRemotePeer = (notifPeer: PeerNotificationInfo, store: Store) => {
  return new HMSRemotePeer({
    peerId: notifPeer.peer_id,
    name: notifPeer.info.name,
    role: store.getPolicyForRole(notifPeer.role),
    customerUserId: notifPeer.info.user_id,
    metadata: notifPeer.info.data,
    groups: notifPeer.groups,
    type: notifPeer.info.type,
  });
};
