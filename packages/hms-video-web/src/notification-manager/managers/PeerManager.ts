import { TrackManager } from './TrackManager';
import { HMSPeer, HMSPeerUpdate, HMSTrackUpdate, HMSUpdateListener } from '../../interfaces';
import { HMSRemoteVideoTrack } from '../../media/tracks';
import { HMSRemotePeer } from '../../sdk/models/peer';
import { IStore } from '../../sdk/store';
import { convertDateNumToDate } from '../../utils/date';
import HMSLogger from '../../utils/logger';
import { HMSNotificationMethod } from '../HMSNotificationMethod';
import { PeerNotification } from '../HMSNotifications';

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
  private readonly TAG = '[PeerManager]';
  constructor(private store: IStore, private trackManager: TrackManager, public listener?: HMSUpdateListener) {}

  handleNotification(method: string, notification: any) {
    switch (method) {
      case HMSNotificationMethod.PEER_JOIN: {
        const peer = notification as PeerNotification;
        this.handlePeerJoin(peer);
        break;
      }

      case HMSNotificationMethod.PEER_LEAVE: {
        const peer = notification as PeerNotification;
        this.handlePeerLeave(peer);
        break;
      }
      case HMSNotificationMethod.PEER_UPDATE:
        this.handlePeerUpdate(notification as PeerNotification);
        break;
      default:
        break;
    }
  }

  handlePeerList = (peers: PeerNotification[]) => {
    if (peers.length === 0) {
      this.listener?.onPeerUpdate(HMSPeerUpdate.PEER_LIST, []);
      return;
    }
    const hmsPeers: HMSRemotePeer[] = [];
    const newPeers = new Set(peers.map(peer => peer.peer_id));
    this.store.getRemotePeers().forEach(({ peerId, fromRoomState }) => {
      /**
       * Remove only if the peer join happened from preview roomstate update. This will prevent the peer joined
       * from peer-join event post join from being removed from the store.
       */
      if (!newPeers.has(peerId) && fromRoomState) {
        this.store.removePeer(peerId);
      }
    });
    for (const peer of peers) {
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
    HMSLogger.d(this.TAG, `PEER_LEAVE`, peer.peer_id, `remainingPeers=${this.store.getPeers().length}`);

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
      this.updateSimulcastLayersForPeer(peer);
      this.listener?.onPeerUpdate(HMSPeerUpdate.ROLE_UPDATED, peer);
    }
    this.handlePeerInfoUpdate({ peer, ...notification.info });
  }

  handlePeerInfoUpdate({ peer, name, data }: { peer?: HMSPeer; name?: string; data?: string }) {
    if (!peer) {
      return;
    }
    if (name && peer.name !== name) {
      peer.updateName(name);
      this.listener?.onPeerUpdate(HMSPeerUpdate.NAME_UPDATED, peer);
    }
    if (data && peer.metadata !== data) {
      peer.updateMetadata(data);
      this.listener?.onPeerUpdate(HMSPeerUpdate.METADATA_UPDATED, peer);
    }
  }

  private makePeer(peer: PeerNotification) {
    let hmsPeer = this.store.getPeerById(peer.peer_id) as HMSRemotePeer;
    if (!hmsPeer) {
      hmsPeer = new HMSRemotePeer({
        peerId: peer.peer_id,
        name: peer.info.name,
        customerUserId: peer.info.user_id,
        metadata: peer.info.data,
        role: this.store.getPolicyForRole(peer.role),
        joinedAt: convertDateNumToDate(peer.joined_at),
        fromRoomState: !!peer.is_from_room_state,
      });
      this.store.addPeer(hmsPeer);
      HMSLogger.d(this.TAG, `adding to the peerList`, `${hmsPeer}`);
    }

    for (const trackId in peer.tracks) {
      this.store.setTrackState({
        peerId: peer.peer_id,
        trackInfo: peer.tracks[trackId],
      });
    }
    return hmsPeer;
  }

  private updateSimulcastLayersForPeer(peer: HMSPeer) {
    this.store.getPeerTracks(peer.peerId).forEach(track => {
      if (track.type === 'video' && ['regular', 'screen'].includes(track.source!)) {
        const remoteTrack = track as HMSRemoteVideoTrack;
        const simulcastDefinitions = this.store.getSimulcastDefinitionsForPeer(peer, remoteTrack.source!);
        remoteTrack.setSimulcastDefinitons(simulcastDefinitions);
      }
    });
  }
}
