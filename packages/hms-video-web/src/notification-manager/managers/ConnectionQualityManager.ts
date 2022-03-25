import { HMSConnectionQuality, HMSConnectionQualityListener } from '../../interfaces';
import { ConnectionQualityList } from '../HMSNotifications';

export class ConnectionQualityManager {
  constructor(public listener?: HMSConnectionQualityListener) {}

  handleQualityUpdate(qualityList: ConnectionQualityList) {
    const peers = qualityList.peers;
    const hmsPeers: HMSConnectionQuality[] = peers.map(peer => {
      return {
        peerID: peer.peer_id,
        downlinkQuality: peer.downlink_score,
      };
    });
    this.listener?.onConnectionQualityUpdate(hmsPeers);
  }
}
