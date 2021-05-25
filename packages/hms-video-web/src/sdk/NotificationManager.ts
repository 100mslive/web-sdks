import HMSTrack from '../media/tracks/HMSTrack';
import { HMSTrackType } from '../media/tracks';
import Peer from '../peer';
import { HMSNotificationMethod } from './models/enums/HMSNotificationMethod';
import {
  Peer as PeerNotification,
  HMSNotifications,
  PeerList,
  TrackStateNotification,
  TrackState,
} from './models/HMSNotifications';
import HMSLogger from '../utils/logger';
import HMSPeer from '../interfaces/hms-peer';
import HMSUpdateListener, { HMSAudioListener, HMSPeerUpdate, HMSTrackUpdate } from '../interfaces/update-listener';
import { SpeakerList } from './models/HMSSpeaker';

interface TrackStateEntry {
  peerId: string;
  trackInfo: TrackState;
}

export default class NotificationManager extends EventTarget {
  hmsPeerList: Map<string, HMSPeer> = new Map();
  localPeer!: HMSPeer | null;

  private TAG: string = '[Notification Manager]:';
  private tracksToProcess: Map<string, HMSTrack> = new Map();
  private trackStateMap: Map<string, TrackStateEntry> = new Map();
  private listener!: HMSUpdateListener;
  private audioListener: HMSAudioListener | null = null;

  handleNotification(
    method: HMSNotificationMethod,
    notification: HMSNotifications,
    listener: HMSUpdateListener,
    audioListener: HMSAudioListener | null,
  ) {
    this.listener = listener;
    this.audioListener = audioListener;
    switch (method) {
      case HMSNotificationMethod.PEER_JOIN: {
        const peer = notification as PeerNotification;
        HMSLogger.d(this.TAG, `PEER_JOIN event`, peer, notification);
        this.handlePeerJoin(peer);
        break;
      }
      case HMSNotificationMethod.PEER_LEAVE: {
        const peer = notification as PeerNotification;
        HMSLogger.d(this.TAG, `PEER_LEAVE event`, peer);
        this.handlePeerLeave(peer);
        break;
      }
      case HMSNotificationMethod.PEER_LIST: {
        const peerList = notification as PeerList;
        HMSLogger.d(this.TAG, `PEER_LIST event`, peerList);
        this.handlePeerList(peerList);
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
      default:
        return;
    }
  }

  handleRoleChange(params: TrackStateNotification) {
    // @DISCUSS: Make everything event based instead?
    this.dispatchEvent(new CustomEvent('role-change', { detail: { params } }));
  }

  handleTrackMetadataAdd(params: TrackStateNotification) {
    HMSLogger.d(this.TAG, `TRACK_METADATA_ADD`, params);

    for (const [trackId, trackEntry] of Object.entries(params.tracks)) {
      this.trackStateMap.set(trackId, {
        peerId: params.peer.peer_id,
        trackInfo: trackEntry,
      });
    }

    this.processPendingTracks();
  }

  private processPendingTracks() {
    const tracksCopy = new Map(this.tracksToProcess);

    tracksCopy.forEach((track) => {
      const state = this.trackStateMap.get(track.trackId);
      if (!state) return;

      const hmsPeer = this.hmsPeerList.get(state.peerId);
      if (!hmsPeer) return;

      track.source = state.trackInfo.source;
      track.setEnabled(!state.trackInfo.mute);

      switch (track.type) {
        case HMSTrackType.AUDIO:
          if (!hmsPeer.audioTrack) {
            hmsPeer.audioTrack = track;
          }
          // @DISCUSS: Do we have auxilliary audio tracks too?
          break;

        case HMSTrackType.VIDEO:
          if (!hmsPeer.videoTrack && track.source === 'regular') {
            hmsPeer.videoTrack = track;
          } else {
            hmsPeer.auxiliaryTracks.push(track);
          }
      }

      track.type === HMSTrackType.AUDIO && this.dispatchEvent(new CustomEvent('track-added', { detail: track }));
      this.listener.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, track, hmsPeer);
      this.tracksToProcess.delete(track.trackId);
    });
  }

  /**
   * Sets the tracks to peer and returns the peer
   */
  handleOnTrackAdd = (track: HMSTrack) => {
    HMSLogger.d(this.TAG, `ONTRACKADD`, track);
    this.tracksToProcess.set(track.trackId, track);
    this.processPendingTracks();
  };

  /**
   * Sets the track of corresponding peer to null and returns the peer
   */
  handleOnTrackRemove = (track: HMSTrack) => {
    HMSLogger.d(this.TAG, `ONTRACKREMOVE`, track);
    const trackStateEntry = this.trackStateMap.get(track.trackId);

    if (!trackStateEntry) return;

    const hmsPeer = this.hmsPeerList.get(trackStateEntry.peerId);

    if (hmsPeer) {
      switch (track.type) {
        case HMSTrackType.AUDIO:
          hmsPeer.audioTrack = null;
          break;
        case HMSTrackType.VIDEO: {
          const screenShareTrackIndex = hmsPeer.auxiliaryTracks.indexOf(track);

          if (screenShareTrackIndex > -1) {
            // @TODO: change this based on source
            hmsPeer.auxiliaryTracks.splice(screenShareTrackIndex, 1);
          } else {
            hmsPeer.videoTrack = null;
          }
        }
      }
      track.type === HMSTrackType.AUDIO && this.dispatchEvent(new CustomEvent('track-removed', { detail: track }));
      this.listener.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, track, hmsPeer);
    }
  };

  handleTrackUpdate = (params: TrackStateNotification) => {
    HMSLogger.d(this.TAG, `TRACK_UPDATE`, params);

    const hmsPeer = this.hmsPeerList.get(params.peer.peer_id);
    if (!hmsPeer) return;

    for (const [trackId, trackEntry] of Object.entries(params.tracks)) {
      const currentTrackStateInfo = Object.assign({}, this.trackStateMap.get(trackId)?.trackInfo);

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
            this.listener.onTrackUpdate(HMSTrackUpdate.TRACK_MUTED, track, hmsPeer);
          } else {
            this.listener.onTrackUpdate(HMSTrackUpdate.TRACK_UNMUTED, track, hmsPeer);
          }
        } else if (currentTrackStateInfo.description !== trackEntry.description) {
          this.listener.onTrackUpdate(HMSTrackUpdate.TRACK_DESCRIPTION_CHANGED, track, hmsPeer);
        }
      }
    }
  };

  cleanUp = () => {
    this.hmsPeerList.clear();
  };

  findPeerByPeerId = (peerId: string) => {
    if (this.localPeer?.peerId === peerId) {
      return this.localPeer;
    }

    return this.hmsPeerList.get(peerId);
  };

  private handlePeerJoin = (peer: PeerNotification) => {
    const hmsPeer = new Peer({
      peerId: peer.peerId,
      name: peer.info.name,
      isLocal: false,
      customerDescription: '',
      role: peer.role,
    });

    this.hmsPeerList.set(peer.peerId, hmsPeer);
    HMSLogger.d(this.TAG, `adding to the peerList`, hmsPeer);

    peer.tracks.forEach((track) => {
      this.trackStateMap.set(track.track_id, {
        peerId: peer.peerId,
        trackInfo: track,
      });
    });

    this.processPendingTracks();
  };

  private handlePeerLeave = (peer: PeerNotification) => {
    this.hmsPeerList.delete(peer.peerId);
  };

  private handlePeerList = (peerList: PeerList) => {
    const peers = peerList.peers;
    peers?.forEach((peer) => this.handlePeerJoin(peer));
  };

  /**
   * @param speakerList List of speakers[peer_id, level] sorted by level in descending order.
   */
  handleActiveSpeakers(speakerList: SpeakerList) {
    const speakers = speakerList.speakers;
    this.audioListener?.onAudioLevelUpdate(speakers);
    const dominantSpeaker = speakers[0];
    if (dominantSpeaker) {
      const dominantSpeakerPeer = this.findPeerByPeerId(dominantSpeaker.peerId);
      this.listener.onPeerUpdate(HMSPeerUpdate.BECAME_DOMINANT_SPEAKER, dominantSpeakerPeer!);
    } else {
      this.listener.onPeerUpdate(HMSPeerUpdate.RESIGNED_DOMINANT_SPEAKER, null);
    }
  }

  private getPeerTrackByTrackId(peerId: string, trackId: string) {
    const peer = this.findPeerByPeerId(peerId);

    if (peer?.audioTrack?.trackId === trackId) {
      return peer.audioTrack;
    } else if (peer?.videoTrack?.trackId === trackId) {
      return peer.videoTrack;
    } else {
      return peer?.auxiliaryTracks.find((track) => track.trackId === trackId);
    }
  }
}
