import EventEmitter from 'events';
import { HMSRemoteTrack } from '../media/streams/HMSRemoteStream';
import { HMSTrackType, HMSAudioTrack, HMSRemoteAudioTrack, HMSRemoteVideoTrack } from '../media/tracks';
import { HMSPeer, HMSRemotePeer } from './models/peer';
import { HMSNotificationMethod } from './models/enums/HMSNotificationMethod';
import {
  Peer as PeerNotification,
  HMSNotifications,
  PeerList,
  TrackStateNotification,
  TrackState,
  PolicyParams,
  SpeakerList,
} from './models/HMSNotifications';
import HMSLogger from '../utils/logger';
import HMSUpdateListener, { HMSAudioListener, HMSPeerUpdate, HMSTrackUpdate } from '../interfaces/update-listener';
import { HMSSpeaker } from '../interfaces/speaker';
import Message from './models/HMSMessage';
import { IStore } from './store/IStore';
import { HMSRoleChangeRequest, RoleChangeRequestParams } from '../interfaces/role-change-request';

interface TrackStateEntry {
  peerId: string;
  trackInfo: TrackState;
}

// @TODO: Split into separate managers
export default class NotificationManager {
  private TAG: string = '[Notification Manager]:';
  private tracksToProcess: Map<string, HMSRemoteTrack> = new Map();
  private trackStateMap: Map<string, TrackStateEntry> = new Map();
  private listener!: HMSUpdateListener;
  private audioListener: HMSAudioListener | null = null;
  private eventEmitter: EventEmitter = new EventEmitter();

  constructor(private readonly store: IStore) {}

  handleNotification(
    method: HMSNotificationMethod,
    notification: HMSNotifications,
    isReconnecting: boolean,
    listener: HMSUpdateListener,
    audioListener: HMSAudioListener | null,
  ) {
    this.listener = listener;
    this.audioListener = audioListener;
    switch (method) {
      case HMSNotificationMethod.PEER_JOIN: {
        const peer = notification as PeerNotification;
        HMSLogger.d(this.TAG, `PEER_JOIN event`, peer);
        this.handlePeerJoin(peer);
        break;
      }
      case HMSNotificationMethod.PEER_LEAVE: {
        const peer = notification as PeerNotification;
        this.handlePeerLeave(peer);
        break;
      }
      case HMSNotificationMethod.PEER_LIST: {
        const peerList = notification as PeerList;
        if (isReconnecting) {
          HMSLogger.d(this.TAG, `RECONNECT_PEER_LIST event`, peerList);
          this.handleReconnectPeerList(peerList);
        } else {
          HMSLogger.d(this.TAG, `PEER_LIST event`, peerList);
          this.handleInitialPeerList(peerList);
        }
        break;
      }
      case HMSNotificationMethod.TRACK_METADATA_ADD: {
        this.handleTrackMetadataAdd(notification as TrackStateNotification);
        break;
      }
      case HMSNotificationMethod.TRACK_UPDATE: {
        this.handleTrackUpdate(notification as TrackStateNotification);
        break;
      }
      case HMSNotificationMethod.ROLE_CHANGE: {
        this.handleRoleChange(notification as TrackStateNotification);
        break;
      }
      case HMSNotificationMethod.ACTIVE_SPEAKERS:
        this.handleActiveSpeakers(notification as SpeakerList);
        break;

      case HMSNotificationMethod.BROADCAST:
        this.handleBroadcast(notification as Message);
        break;

      case HMSNotificationMethod.POLICY_CHANGE:
        this.handlePolicyChange(notification as PolicyParams);
        break;

      case HMSNotificationMethod.ROLE_CHANGE_REQUEST:
        this.handleRoleChangeRequest(notification as RoleChangeRequestParams);
        break;

      case HMSNotificationMethod.PEER_UPDATE:
        this.handlePeerUpdate(notification as PeerNotification);
        break;

      default:
        return;
    }
  }

  private handlePeerUpdate(notification: PeerNotification) {
    const peer = this.store.getPeerById(notification.peerId);

    if (!peer) {
      return;
    }

    if (peer.role && peer.role.name !== notification.role) {
      const newRole = this.store.getPolicyForRole(notification.role);
      peer.updateRole(newRole);
      this.listener?.onPeerUpdate(HMSPeerUpdate.ROLE_UPDATED, peer);
    }
  }

  private handleRoleChangeRequest(notification: RoleChangeRequestParams) {
    const request: HMSRoleChangeRequest = {
      requestedBy: this.store.getPeerById(notification.requested_by) as HMSRemotePeer,
      role: this.store.getPolicyForRole(notification.role),
      token: notification.token,
    };

    this.listener?.onRoleChangeRequest(request);
  }

  private handleRoleChange(params: TrackStateNotification) {
    // @DISCUSS: Make everything event based instead?
    this.eventEmitter.emit('role-change', { detail: { params } });
  }

  private handlePolicyChange(params: PolicyParams) {
    const localPeer = this.store.getLocalPeer();

    if (localPeer && !localPeer.role) {
      const newRole = params.known_roles[params.name];
      localPeer.updateRole(newRole);
    }

    this.store.setKnownRoles(params.known_roles);
    // handle when role is not present in known_roles
    const publishParams = params.known_roles[params.name]?.publishParams;
    if (publishParams && Object.keys(publishParams).length > 0) {
      const { videoSimulcastLayers, screenSimulcastLayers } = publishParams;
      this.store.setVideoSimulcastLayers(videoSimulcastLayers);
      this.store.setScreenshareSimulcastLayers(screenSimulcastLayers);
    }

    if (localPeer?.role && localPeer.role.name !== params.name) {
      const newRole = this.store.getPolicyForRole(params.name);
      const oldRole = localPeer.role;
      localPeer.updateRole(newRole);
      this.eventEmitter.emit('local-peer-role-update', { detail: { oldRole, newRole } });
    }
    this.eventEmitter.emit('policy-change', { detail: { params } });
  }

  private handleTrackMetadataAdd(params: TrackStateNotification) {
    HMSLogger.d(this.TAG, `TRACK_METADATA_ADD`, params);

    for (const trackId in params.tracks) {
      this.trackStateMap.set(trackId, {
        peerId: params.peer.peer_id,
        trackInfo: params.tracks[trackId],
      });
    }

    this.processPendingTracks();
  }

  private processPendingTracks() {
    const tracksCopy = new Map(this.tracksToProcess);

    tracksCopy.forEach((track) => {
      const state = this.trackStateMap.get(track.trackId);
      if (!state) {
        return;
      }

      const hmsPeer = this.store.getPeerById(state.peerId);
      if (!hmsPeer) {
        return;
      }

      track.source = state.trackInfo.source;
      track.setEnabled(!state.trackInfo.mute);

      switch (track.type) {
        case HMSTrackType.AUDIO:
          if (!hmsPeer.audioTrack && track.source === 'regular') {
            hmsPeer.audioTrack = track as HMSRemoteAudioTrack;
          } else {
            hmsPeer.auxiliaryTracks.push(track);
          }
          break;
        case HMSTrackType.VIDEO:
          const remoteTrack = track as HMSRemoteVideoTrack;
          const simulcastDefinitions = this.store.getSimulcastDefinitionsForPeer(hmsPeer, remoteTrack.source!);
          remoteTrack.setSimulcastDefinitons(simulcastDefinitions);
          if (!hmsPeer.videoTrack && track.source === 'regular') {
            hmsPeer.videoTrack = remoteTrack;
          } else {
            hmsPeer.auxiliaryTracks.push(remoteTrack);
          }
      }

      track.type === HMSTrackType.AUDIO && this.eventEmitter.emit('track-added', { detail: track });
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, track, hmsPeer);
      this.tracksToProcess.delete(track.trackId);
    });
  }

  /**
   * Sets the tracks to peer and returns the peer
   */
  handleOnTrackAdd = (track: HMSRemoteTrack) => {
    HMSLogger.d(this.TAG, `ONTRACKADD`, track);
    this.store.addTrack(track);
    this.tracksToProcess.set(track.trackId, track);
    this.processPendingTracks();
  };

  /**
   * Sets the track of corresponding peer to null and returns the peer
   */
  handleOnTrackRemove = (track: HMSRemoteTrack) => {
    HMSLogger.d(this.TAG, `ONTRACKREMOVE`, track);
    const trackStateEntry = this.trackStateMap.get(track.trackId);

    if (!trackStateEntry) return;

    // emit this event here as peer will already be removed(if left the room) by the time this event is received
    track.type === HMSTrackType.AUDIO && this.eventEmitter.emit('track-removed', { detail: track });
    const hmsPeer = this.store.getPeerById(trackStateEntry.peerId);
    if (!hmsPeer) {
      return;
    }

    const removeAuxiliaryTrack = () => {
      const screenshareTrackIndex = hmsPeer.auxiliaryTracks.indexOf(track);
      if (screenshareTrackIndex > -1) {
        hmsPeer.auxiliaryTracks.splice(screenshareTrackIndex, 1);
      }
    };

    switch (track.type) {
      case HMSTrackType.AUDIO:
        if (track.source === 'screen') {
          removeAuxiliaryTrack();
        } else {
          hmsPeer.audioTrack = undefined;
        }
        break;
      case HMSTrackType.VIDEO: {
        if (track.source === 'screen') {
          removeAuxiliaryTrack();
        } else {
          hmsPeer.videoTrack = undefined;
        }
      }
    }

    this.store.removeTrack(track.trackId);
    this.listener.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, track, hmsPeer);
  };

  private handleTrackUpdate = (params: TrackStateNotification) => {
    HMSLogger.d(this.TAG, `TRACK_UPDATE`, params);

    const hmsPeer = this.store.getPeerById(params.peer.peer_id);
    if (!hmsPeer) {
      return;
    }

    for (const trackId in params.tracks) {
      const currentTrackStateInfo = Object.assign({}, this.trackStateMap.get(trackId)?.trackInfo);

      const trackEntry = params.tracks[trackId];
      const track = this.getPeerTrackByTrackId(hmsPeer.peerId, trackId);

      this.trackStateMap.set(trackId, {
        peerId: params.peer.peer_id,
        trackInfo: { ...currentTrackStateInfo, ...trackEntry },
      });

      // TRACK_UPDATE came before TRACK_ADD -> update state, process pending tracks when TRACK_ADD arrives.
      if (!track || this.tracksToProcess.has(trackId)) {
        this.processPendingTracks();
      } else {
        track.setEnabled(!trackEntry.mute);

        if (currentTrackStateInfo.mute !== trackEntry.mute) {
          if (trackEntry.mute) {
            this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_MUTED, track, hmsPeer);
          } else {
            this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_UNMUTED, track, hmsPeer);
          }
        } else if (currentTrackStateInfo.description !== trackEntry.description) {
          this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_DESCRIPTION_CHANGED, track, hmsPeer);
        }
      }
    }
  };

  addEventListener(event: string, listener: EventListener) {
    this.eventEmitter.addListener(event, listener);
  }

  removeEventListener(event: string, listener: EventListener) {
    this.eventEmitter.removeListener(event, listener);
  }

  private handlePeerJoin = (peer: PeerNotification) => {
    const hmsPeer = new HMSRemotePeer({
      peerId: peer.peerId,
      name: peer.info.name,
      customerUserId: peer.info.userId,
      customerDescription: peer.info.data,
      role: this.store.getPolicyForRole(peer.role),
    });

    this.store.addPeer(hmsPeer);
    HMSLogger.d(this.TAG, `adding to the peerList`, hmsPeer);

    for (const trackId in peer.tracks) {
      this.trackStateMap.set(trackId, {
        peerId: peer.peerId,
        trackInfo: peer.tracks[trackId],
      });
    }

    this.listener?.onPeerUpdate(HMSPeerUpdate.PEER_JOINED, hmsPeer);
    this.processPendingTracks();
  };

  private handlePeerLeave = (peer: PeerNotification) => {
    const hmsPeer = this.store.getPeerById(peer.peerId);
    this.store.removePeer(peer.peerId);
    HMSLogger.d(this.TAG, `PEER_LEAVE event`, peer, this.store.getPeers());

    if (hmsPeer) {
      if (hmsPeer.audioTrack) {
        this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, hmsPeer.audioTrack, hmsPeer);
      }

      if (hmsPeer.videoTrack) {
        this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, hmsPeer.videoTrack, hmsPeer);
      }

      hmsPeer.auxiliaryTracks?.forEach((track) => {
        this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, track, hmsPeer);
      });

      this.listener?.onPeerUpdate(HMSPeerUpdate.PEER_LEFT, hmsPeer);
    }
  };

  private handleInitialPeerList = (peerList: PeerList) => {
    const peers = peerList.peers;
    peers?.forEach((peer) => this.handlePeerJoin(peer));
  };

  private handleReconnectPeerList = (peerList: PeerList) => {
    const currentPeerList = this.store.getRemotePeers();
    const peersToRemove = currentPeerList.filter(
      (hmsPeer) => !peerList.peers.some((peer) => peer.peerId === hmsPeer.peerId),
    );

    HMSLogger.d(this.TAG, { peersToRemove });

    // Send peer-leave updates to all the missing peers
    peersToRemove.forEach((peer) => {
      const peerNotification = new PeerNotification({
        peer_id: peer.peerId,
        role: peer.role,
        info: {
          name: peer.name,
          data: peer.customerDescription,
          user_id: peer.customerUserId,
        },
      });

      this.handlePeerLeave(peerNotification);
    });

    // Check for any tracks which are added/removed
    peerList.peers.forEach((newPeerNotification) => {
      const oldPeer = this.store.getPeerById(newPeerNotification.peerId);
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
          if (!this.getPeerTrackByTrackId(oldPeer.peerId, trackData.track_id)) {
            // NOTE: We assume that, once the connection is re-established,
            //  transport layer will send a native onTrackAdd
            this.trackStateMap.set(trackData.track_id, {
              peerId: oldPeer.peerId,
              trackInfo: trackData,
            });
          }
        });

        // Handle RTC track add and track state change.
        this.handleTrackUpdate({
          peer: { info: newPeerNotification.info, peer_id: newPeerNotification.peerId },
          tracks: newPeerNotification.tracks,
        });
      } else {
        // New peer joined while reconnecting
        this.handlePeerJoin(newPeerNotification);
      }
    });
  };

  /**
   * @param speakerList List of speakers[peer_id, level] sorted by level in descending order.
   */
  private handleActiveSpeakers(speakerList: SpeakerList) {
    const speakers = speakerList.speakers;
    const hmsSpeakers: HMSSpeaker[] = speakers.map((speaker) => ({
      audioLevel: speaker.audioLevel,
      peer: this.store.getPeerById(speaker.peerId)!,
      track: this.store.getTrackById(speaker.trackId) as HMSAudioTrack,
    }));

    this.audioListener?.onAudioLevelUpdate(hmsSpeakers);
    this.store.updateSpeakers(hmsSpeakers);
    const dominantSpeaker = speakers[0];

    if (dominantSpeaker) {
      const dominantSpeakerPeer = this.store.getPeerById(dominantSpeaker.peerId);
      this.listener?.onPeerUpdate(HMSPeerUpdate.BECAME_DOMINANT_SPEAKER, dominantSpeakerPeer!);
    } else {
      this.listener?.onPeerUpdate(HMSPeerUpdate.RESIGNED_DOMINANT_SPEAKER, null);
    }
  }

  private handleBroadcast(message: Message) {
    HMSLogger.d(this.TAG, `Received Message:: `, message);
    this.listener?.onMessageReceived(message);
  }

  private getPeerTrackByTrackId(peerId: string, trackId: string) {
    const peer = this.store.getPeerById(peerId);

    if (peer?.audioTrack?.trackId === trackId) {
      return peer?.audioTrack;
    } else if (peer?.videoTrack?.trackId === trackId) {
      return peer?.videoTrack;
    } else {
      return peer?.auxiliaryTracks.find((track) => track.trackId === trackId);
    }
  }

  private removePeerTrack(peer: HMSPeer, trackId: string) {
    if (peer.audioTrack?.trackId === trackId) {
      peer.audioTrack = undefined;
    } else if (peer.videoTrack?.trackId === trackId) {
      peer.videoTrack = undefined;
    } else {
      const track = peer.auxiliaryTracks.find((track) => track.trackId === trackId);
      track && peer.auxiliaryTracks.splice(peer.auxiliaryTracks.indexOf(track), 1);
    }
  }
}
