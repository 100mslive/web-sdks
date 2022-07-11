import { HMSConnectionQuality, HMSConnectionQualityListener } from '../../interfaces';
import { ConnectionQuality, ConnectionQualityList } from '../HMSNotifications';

export class ConnectionQualityManager {
  private prevQualityListPeers?: ConnectionQuality[];
  constructor(public listener?: HMSConnectionQualityListener) {}

  handleQualityUpdate(qualityList: ConnectionQualityList) {
    if (this.areQualityListEqual(qualityList?.peers, this.prevQualityListPeers)) {
      return;
    }
    const peers = qualityList.peers;
    this.prevQualityListPeers = peers;
    const hmsPeers: HMSConnectionQuality[] = peers.map(peer => {
      return {
        peerID: peer.peer_id,
        downlinkQuality: peer.downlink_score,
      };
    });
    this.listener?.onConnectionQualityUpdate(hmsPeers);
  }

  private areQualityListEqual(newQualities: ConnectionQuality[], prevQualities?: ConnectionQuality[]): boolean {
    if (!prevQualities || newQualities.length !== prevQualities.length) {
      return false;
    }
    const newQualitiesMap = new Map(newQualities.map(quality => [quality.peer_id, quality]));
    for (const prevQuality of prevQualities) {
      const newQuality = newQualitiesMap.get(prevQuality.peer_id);
      if (!newQuality || newQuality.downlink_score !== prevQuality.downlink_score) {
        return false;
      }
    }
    return true;
  }
}
