import { HMSPeerUpdate, HMSTrackUpdate, HMSUpdateListener } from '../../interfaces';
import { HMSRemotePeer } from '../../sdk/models/peer';
import { IStore } from '../../sdk/store';
import HMSLogger from '../../utils/logger';
import { PeerNotification } from '../HMSNotifications';
import { TrackManager } from './TrackManager';

/**
 * Handles:
 * - New peer join
 * - Peer Leave
 * - Role update for peer
 *
 * Notes:
 * - Peer join comes with track meta-data,
 * we add it to the store and call TrackManager to process it when RTC Track comes in.
 */
export class PeerManager {
  constructor(private store: IStore, private trackManager: TrackManager, public listener?: HMSUpdateListener) {}

  private get TAG() {
    return `[${this.constructor.name}]`;
  }

  handlePeerList = (peers: PeerNotification[]) => {
    if (peers.length === 0) return;
    let hmsPeers: HMSRemotePeer[] = [];
    for (let peer of peers) {
      hmsPeers.push(this.makePeer(peer));
    }
    this.listener?.onPeerUpdate(HMSPeerUpdate.PEER_LIST, hmsPeers);
    this.trackManager.processPendingTracks();
  };

  handlePeerJoin = (peer: PeerNotification) => {
    const hmsPeer = this.makePeer(peer);

    this.listener?.onPeerUpdate(HMSPeerUpdate.PEER_JOINED, hmsPeer);
    this.trackManager.processPendingTracks();
  };

  handlePeerLeave = (peer: PeerNotification) => {
    const hmsPeer = this.store.getPeerById(peer.peer_id);
    this.store.removePeer(peer.peer_id);
    HMSLogger.d(this.TAG, `PEER_LEAVE event`, peer, this.store.getPeers());

    if (!hmsPeer) {
      return;
    }

    if (hmsPeer.audioTrack) {
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, hmsPeer.audioTrack, hmsPeer);
    }

    if (hmsPeer.videoTrack) {
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, hmsPeer.videoTrack, hmsPeer);
    }

    hmsPeer.auxiliaryTracks?.forEach(track => {
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, track, hmsPeer);
    });

    this.listener?.onPeerUpdate(HMSPeerUpdate.PEER_LEFT, hmsPeer);
  };

  handlePeerUpdate(notification: PeerNotification) {
    const peer = this.store.getPeerById(notification.peer_id);

    if (!peer) {
      return;
    }

    if (peer.role && peer.role.name !== notification.role) {
      const newRole = this.store.getPolicyForRole(notification.role);
      peer.updateRole(newRole);
      this.listener?.onPeerUpdate(HMSPeerUpdate.ROLE_UPDATED, peer);
    }

    const info = notification.info;
    if (info.name && peer.name !== info.name) {
      peer.updateName(info.name);
      this.listener?.onPeerUpdate(HMSPeerUpdate.NAME_UPDATED, peer);
    }

    if (info.data && peer.metadata !== info.data) {
      peer.updateMetadata(info.data);
      this.listener?.onPeerUpdate(HMSPeerUpdate.METADATA_UPDATED, peer);
    }
  }

  private makePeer(peer: PeerNotification) {
    const hmsPeer = new HMSRemotePeer({
      peerId: peer.peer_id,
      name: peer.info.name,
      customerUserId: peer.info.user_id,
      metadata: peer.info.data,
      role: this.store.getPolicyForRole(peer.role),
    });

    this.store.addPeer(hmsPeer);
    HMSLogger.d(this.TAG, `adding to the peerList`, hmsPeer);

    for (const trackId in peer.tracks) {
      this.store.setTrackState({
        peerId: peer.peer_id,
        trackInfo: peer.tracks[trackId],
      });
    }
    return hmsPeer;
  }
}
