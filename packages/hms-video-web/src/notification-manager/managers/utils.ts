import { HMSRemotePeer } from '../../sdk/models/peer';
import { IStore } from '../../sdk/store';
import { PeerNotificationInfo } from '../HMSNotifications';

export const createRemotePeer = (notifPeer: PeerNotificationInfo, store: IStore) => {
  return new HMSRemotePeer({
    peerId: notifPeer.peer_id,
    name: notifPeer.info.name,
    role: store.getPolicyForRole(notifPeer.role),
    customerUserId: notifPeer.info.user_id,
    metadata: notifPeer.info.data,
    groups: notifPeer.groups,
  });
};
