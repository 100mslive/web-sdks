import { PeerManager } from './PeerManager';
import { TrackManager } from './TrackManager';
import { HMSTrackUpdate, HMSUpdateListener } from '../../interfaces';
import { HMSPeer } from '../../sdk/models/peer';
import { Store } from '../../sdk/store';
import HMSLogger from '../../utils/logger';
import { HMSNotificationMethod } from '../HMSNotificationMethod';
import { PeerListNotification, PeerNotification, PeriodicRoomState } from '../HMSNotifications';

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
  private readonly TAG = '[PeerListManager]';
  constructor(
    private store: Store,
    private peerManager: PeerManager,
    private trackManager: TrackManager,
    public listener?: HMSUpdateListener,
  ) {}

  handleNotification(method: string, notification: any, isReconnecting: boolean) {
    if (method === HMSNotificationMethod.PEER_LIST) {
      const peerList = notification as PeerListNotification;
      if (isReconnecting) {
        HMSLogger.d(this.TAG, `RECONNECT_PEER_LIST event`, JSON.stringify(peerList, null, 2));
        this.handleReconnectPeerList(peerList);
      } else {
        // TODO: Don't call initial peerlist if atleast 1room state had happen
        HMSLogger.d(this.TAG, `PEER_LIST event`, JSON.stringify(peerList, null, 2));
        this.handleInitialPeerList(peerList);
      }
    } else if (method === HMSNotificationMethod.ROOM_STATE) {
      const roomState = notification as PeriodicRoomState;
      this.handlePreviewRoomState(roomState);
    }
  }

  private handleInitialPeerList = (peerList: PeerListNotification) => {
    const peers = Object.values(peerList.peers);
    this.peerManager.handlePeerList(peers);
  };

  private handleReconnectPeerList = (peerList: PeerListNotification) => {
    this.handleRepeatedPeerList(peerList.peers);
  };

  private handlePreviewRoomState = (roomState: PeriodicRoomState) => {
    if (!this.store.hasRoleDetailsArrived()) {
      // we can't process the peers yet we don't know enough about them(role info)
      return;
    }
    const roomPeers = roomState.peers;
    if (roomPeers === null || roomPeers === undefined) {
      // in this case, room state doesn't say anything about the peers,
      // there can be optimisations in place to not send this field when it's unchanged from previously sent value.
      // If there are no peers either roomState.peers will be empty object
      // or peer_count will be 0(handled below)
      if (roomState.peer_count === 0) {
        this.handleRepeatedPeerList({});
      }
      return;
    }
    // we don't get tracks inside the peer object in room state, we're adding
    // an empty value here so rest of the code flow can ignore this change, the below
    // can be changed when tracks will be sent as a separate object in future
    Object.keys(roomPeers).forEach(peer => {
      roomPeers[peer].tracks = {};
      roomPeers[peer].is_from_room_state = true;
    });
    this.handleRepeatedPeerList(roomPeers);
  };

  private handleRepeatedPeerList = (peersMap: Record<string, PeerNotification>) => {
    const currentPeerList = this.store.getRemotePeers();
    const peers = Object.values(peersMap);
    const peersToRemove = currentPeerList.filter(hmsPeer => !peersMap[hmsPeer.peerId]);
    if (peersToRemove.length > 0) {
      HMSLogger.d(this.TAG, `${peersToRemove}`);
    }

    // Send peer-leave updates to all the missing peers
    peersToRemove.forEach(peer => {
      const peerNotification: PeerNotification = {
        peer_id: peer.peerId,
        role: peer.role?.name || '',
        info: {
          name: peer.name,
          data: peer.metadata || '',
          user_id: peer.customerUserId || '',
          type: peer.type,
        },
        tracks: {},
        groups: [],
        realtime: peer.realtime,
      };

      this.peerManager.handlePeerLeave(peerNotification);
    });

    const peerList: PeerNotification[] = [];
    // Check for any tracks which are added/removed
    peers.forEach(newPeerNotification => {
      const oldPeer = this.store.getPeerById(newPeerNotification.peer_id);
      const newPeerTrackStates = Object.values(newPeerNotification.tracks);

      if (oldPeer) {
        // Peer already present in room, we take diff between the tracks
        const tracks = this.store.getPeerTracks(oldPeer.peerId);

        // Remove all the tracks which are not present in the peer.tracks
        tracks.forEach(track => {
          if (!newPeerNotification.tracks[track.trackId]) {
            this.removePeerTrack(oldPeer, track.trackId);
            this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, track, oldPeer);
          }
        });

        // Add track-metadata for all the new tracks
        newPeerTrackStates.forEach(trackData => {
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
        this.trackManager.handleTrackUpdate(
          {
            peer: newPeerNotification,
            tracks: newPeerNotification.tracks,
          },
          false,
        );

        // Update peer's role locally, new role is received from the reconnect peer-list
        this.peerManager.handlePeerUpdate(newPeerNotification);
        peerList.push(newPeerNotification);
      } else {
        // New peer joined while reconnecting
        peerList.push(newPeerNotification);
      }
    });
    if (peerList.length > 0) {
      this.peerManager.handlePeerList(peerList);
    }
  };

  private removePeerTrack(peer: HMSPeer, trackId: string) {
    HMSLogger.d(this.TAG, `removing track - ${trackId} from ${peer}`);
    if (peer.audioTrack?.trackId === trackId) {
      peer.audioTrack = undefined;
    } else if (peer.videoTrack?.trackId === trackId) {
      peer.videoTrack = undefined;
    } else {
      const trackIndex = peer.auxiliaryTracks.findIndex(track => track.trackId === trackId);
      trackIndex >= 0 && peer.auxiliaryTracks.splice(trackIndex, 1);
    }
  }
}
