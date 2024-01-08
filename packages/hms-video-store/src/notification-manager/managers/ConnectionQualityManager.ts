import { HMSConnectionQuality, HMSConnectionQualityListener } from '../../interfaces';
import { Store } from '../../sdk/store';
import { ConnectionQualityList } from '../HMSNotifications';

export class ConnectionQualityManager {
  constructor(private store: Store, public listener?: HMSConnectionQualityListener) {}

  handleQualityUpdate(qualityList: ConnectionQualityList) {
    const peers = qualityList.peers;
    const hmsPeers: HMSConnectionQuality[] = peers.map(peer => {
      const storePeer = this.store.getPeerById(peer.peer_id);
      if (storePeer) {
        storePeer.updateNetworkQuality(peer.downlink_score);
      }
      return {
        peerID: peer.peer_id,
        downlinkQuality: peer.downlink_score,
      };
    });
    this.listener?.onConnectionQualityUpdate(hmsPeers);
  }
}
