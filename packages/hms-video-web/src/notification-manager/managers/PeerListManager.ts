import { HMSUpdateListener } from '../..';
import { HMSTrackUpdate } from '../../interfaces';
import { HMSPeer } from '../../sdk/models/peer';
import { IStore } from '../../sdk/store';
import HMSLogger from '../../utils/logger';
import { PeerListNotification, PeerNotification } from '../HMSNotifications';
import { PeerManager } from './PeerManager';
import { TrackManager } from './TrackManager';

/**
 * Handles:
 * - Initial Peer List - get peer and track meta-data for peers who are already in the room when you join
 * - Reconnect Peer List - Handle peer and track changes in the room missed out due to reconnection
 *
 * Cases to handle in reconnect peer list:
 * - Add additional peers as peer join
 * - Remove missing peers as peer leave
 * - For existing peers:
 *    - Add new tracks as track add
 *    - Remove missing tracks as track remove
 *    - Track state change(enabled) as track update
 */
export class PeerListManager {
  constructor(
    private store: IStore,
    private peerManager: PeerManager,
    private trackManager: TrackManager,
    public listener?: HMSUpdateListener,
  ) {}

  private get TAG() {
    return `[${this.constructor.name}]`;
  }

  handleInitialPeerList = (peerList: PeerListNotification) => {
    const peers = Object.values(peerList.peers);
    this.peerManager.handlePeerList(peers);
  };

  handleReconnectPeerList = (peerList: PeerListNotification) => {
    const currentPeerList = this.store.getRemotePeers();
    const peers = Object.values(peerList.peers);
    const peersToRemove = currentPeerList.filter((hmsPeer) => !peerList.peers.hasOwnProperty(hmsPeer.peerId));

    HMSLogger.d(this.TAG, { peersToRemove });

    // Send peer-leave updates to all the missing peers
    peersToRemove.forEach((peer) => {
      const peerNotification: PeerNotification = {
        peer_id: peer.peerId,
        role: peer.role?.name || '',
        info: {
          name: peer.name,
          data: peer.customerDescription || '',
          user_id: peer.customerUserId || '',
        },
        tracks: {},
      };

      this.peerManager.handlePeerLeave(peerNotification);
    });

    // Check for any tracks which are added/removed
    peers.forEach((newPeerNotification) => {
      const oldPeer = this.store.getPeerById(newPeerNotification.peer_id);
      const newPeerTrackStates = Object.values(newPeerNotification.tracks);

      if (oldPeer) {
        // Peer already present in room, we take diff between the tracks
        const tracks = this.store.getPeerTracks(oldPeer.peerId);

        // Remove all the tracks which are not present in the peer.tracks
        tracks.forEach((track) => {
          if (!newPeerNotification.tracks.hasOwnProperty(track.trackId)) {
            this.removePeerTrack(oldPeer, track.trackId);
            this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, track, oldPeer);
          }
        });

        // Add track-metadata for all the new tracks
        newPeerTrackStates.forEach((trackData) => {
          if (!this.store.getTrackById(trackData.track_id)) {
            // NOTE: We assume that, once the connection is re-established,
            //  transport layer will send a native onTrackAdd
            this.store.setTrackState({
              peerId: oldPeer.peerId,
              trackInfo: trackData,
            });
          }
        });

        // Handle RTC track add and track state change.
        this.trackManager.handleTrackUpdate({
          peer: { info: newPeerNotification.info, peer_id: newPeerNotification.peer_id },
          tracks: newPeerNotification.tracks,
        });

        // Update peer's role locally, new role is received from the reconnect peer-list
        this.peerManager.handlePeerUpdate(newPeerNotification);
      } else {
        // New peer joined while reconnecting
        this.peerManager.handlePeerJoin(newPeerNotification);
      }
    });
  };

  private removePeerTrack(peer: HMSPeer, trackId: string) {
    if (peer.audioTrack?.trackId === trackId) {
      peer.audioTrack = undefined;
    } else if (peer.videoTrack?.trackId === trackId) {
      peer.videoTrack = undefined;
    } else {
      const trackIndex = peer.auxiliaryTracks.findIndex((track) => track.trackId === trackId);
      trackIndex >= 0 && peer.auxiliaryTracks.splice(trackIndex, 1);
    }
  }
}
