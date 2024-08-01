import { createRemotePeer } from './utils';
import { VideoTrackLayerUpdate } from '../../connection/channel-messages';
import { EventBus } from '../../events/EventBus';
import { HMSRemotePeer, HMSTrackUpdate, HMSUpdateListener } from '../../interfaces';
import { HMSRemoteAudioTrack, HMSRemoteTrack, HMSRemoteVideoTrack, HMSTrackType } from '../../media/tracks';
import { HMSPeer } from '../../sdk/models/peer';
import { Store } from '../../sdk/store';
import HMSLogger from '../../utils/logger';
import { OnTrackLayerUpdateNotification, TrackState, TrackStateNotification } from '../HMSNotifications';

/**
 * Handles:
 * - Incoming track meta-data from BIZ(signal) to match a track to a peer.
 * - Incoming MediaStreamTracks(wrapped in HMSTracks) from RTCMediaChannel.
 * - Mute/unmute track meta-data updates from BIZ.
 *
 * Since track meta-data and RTC tracks come in asynchronously,
 * we store the track meta-data(TrackState) in SDK Store and tracks temporarily here in tracksToProcess.
 *
 * Once we have both TrackState and track,
 * we add it to peer, send listener.onTrackUpdate and remove it from tracksToProcess.
 *
 * Gotchas:
 * - TRACK_UPDATE comes before TRACK_ADD -> update state, process pending tracks when TRACK_ADD arrives.
 */
export class TrackManager {
  public TAG = '[TrackManager]';
  private tracksToProcess: Map<string, HMSRemoteTrack> = new Map();

  constructor(public store: Store, public eventBus: EventBus, public listener?: HMSUpdateListener) {}

  /**
   * Add event from biz on track-add
   * @param params TrackStateNotification
   */
  handleTrackMetadataAdd(params: TrackStateNotification) {
    HMSLogger.d(this.TAG, `TRACK_METADATA_ADD`, JSON.stringify(params, null, 2));

    for (const trackId in params.tracks) {
      const trackInfo = params.tracks[trackId];
      this.store.setTrackState({
        peerId: params.peer.peer_id,
        trackInfo,
      });
    }
    this.processPendingTracks();
  }

  /**
   * Sets the tracks to peer and returns the peer
   */
  handleTrackAdd = (track: HMSRemoteTrack) => {
    HMSLogger.d(this.TAG, `ONTRACKADD`, `${track}`);
    this.tracksToProcess.set(track.trackId, track);
    this.processPendingTracks();
  };

  handleTrackRemovedPermanently = (notification: TrackStateNotification) => {
    HMSLogger.d(this.TAG, `ONTRACKREMOVE permanently`, notification);
    const trackIds = Object.keys(notification.tracks);

    trackIds.forEach(trackId => {
      const trackStateEntry = this.store.getTrackState(trackId);
      if (!trackStateEntry) {
        return;
      }

      const track = this.store.getTrackById(trackId);
      if (!track) {
        HMSLogger.d(this.TAG, 'Track not found in store');
        return;
      }

      // emit this event here as peer will already be removed(if left the room) by the time this event is received
      track.type === HMSTrackType.AUDIO && this.eventBus.audioTrackRemoved.publish(track as HMSRemoteAudioTrack);
      this.store.removeTrack(track);
      const hmsPeer = this.store.getPeerById(trackStateEntry.peerId);
      if (!hmsPeer) {
        return;
      }
      this.removePeerTracks(hmsPeer, track as HMSRemoteTrack);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, track, hmsPeer);
    });
  };

  /**
   * Sets the track of corresponding peer to null and returns the peer
   */
  handleTrackRemove(track: HMSRemoteTrack, remove = true) {
    HMSLogger.d(this.TAG, `ONTRACKREMOVE`, `${track}`);

    const trackStateEntry = this.store.getTrackState(track.trackId);

    if (!trackStateEntry) {
      return;
    }

    const storeHasTrack = this.store.hasTrack(track);
    if (!storeHasTrack) {
      HMSLogger.d(this.TAG, 'Track not found in store');
      return;
    }

    // remove tracks only when onDemandTracks flag is false
    if (remove) {
      this.store.removeTrack(track);
      const hmsPeer = this.store.getPeerById(trackStateEntry.peerId);
      if (!hmsPeer) {
        return;
      }
      this.removePeerTracks(hmsPeer, track);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, track, hmsPeer);

      // emit this event here as peer will already be removed(if left the room) by the time this event is received
      track.type === HMSTrackType.AUDIO && this.eventBus.audioTrackRemoved.publish(track as HMSRemoteAudioTrack);
    }
  }

  handleTrackLayerUpdate = (params: OnTrackLayerUpdateNotification) => {
    for (const trackId in params.tracks) {
      const trackEntry = params.tracks[trackId];
      const track = this.store.getTrackById(trackId);
      if (!track) {
        continue;
      }

      const peer = this.store.getPeerByTrackId(trackId)!;
      if (!peer) {
        continue;
      }

      if (track instanceof HMSRemoteVideoTrack) {
        this.setLayer(track, trackEntry);
      }
    }
  };

  // eslint-disable-next-line complexity
  handleTrackUpdate = (params: TrackStateNotification, callListener = true) => {
    let hmsPeer = this.store.getPeerById(params.peer.peer_id);
    const notifPeer = params.peer;
    if (!hmsPeer && !notifPeer) {
      HMSLogger.d(this.TAG, 'Track Update ignored - Peer not added to store');
      return;
    }
    if (!hmsPeer) {
      hmsPeer = createRemotePeer(notifPeer, this.store);
      this.store.addPeer(hmsPeer);
    }

    for (const trackId in params.tracks) {
      const currentTrackStateInfo = Object.assign({}, this.store.getTrackState(trackId)?.trackInfo);

      const trackEntry = params.tracks[trackId];
      const track = this.store.getTrackById(trackId);

      this.store.setTrackState({
        peerId: params.peer.peer_id,
        trackInfo: { ...currentTrackStateInfo, ...trackEntry },
      });

      // TRACK_UPDATE came before TRACK_ADD -> update state, process pending tracks when TRACK_ADD arrives.
      if (!track || this.tracksToProcess.has(trackId)) {
        this.processTrackInfo(trackEntry, params.peer.peer_id, callListener);
        this.processPendingTracks();
      } else {
        track.setEnabled(!trackEntry.mute);
        const eventType = this.processTrackUpdate(track as HMSRemoteTrack, currentTrackStateInfo, trackEntry);
        if (eventType) {
          this.listener?.onTrackUpdate(eventType, track, hmsPeer);
        }
      }
    }
  };

  processTrackInfo = (_trackInfo: TrackState, _peerId: string, _callListener?: boolean) => {};

  processPendingTracks = () => {
    const tracksCopy = new Map(this.tracksToProcess);
    tracksCopy.forEach(track => {
      const state = this.store.getTrackState(track.trackId);
      if (!state) {
        HMSLogger.d(this.TAG, 'TrackState not added to store', `peerId - ${track.peerId}`, `trackId -${track.trackId}`);
        return;
      }

      const hmsPeer = this.store.getPeerById(state.peerId);
      if (!hmsPeer) {
        HMSLogger.d(this.TAG, 'Peer not added to store, peerId', state.peerId);
        return;
      }

      track.source = state.trackInfo.source;
      track.peerId = hmsPeer.peerId;
      // set log identifier to initial name of the peer
      track.logIdentifier = hmsPeer.name;
      track.setEnabled(!state.trackInfo.mute);
      this.addAudioTrack(hmsPeer, track);
      this.addVideoTrack(hmsPeer, track);
      /**
       * Don't call onTrackUpdate for audio elements immediately because the operations(eg: setVolume) performed
       * on onTrackUpdate can be overriden in AudioSinkManager when audio element is created
       **/
      track.type === HMSTrackType.AUDIO
        ? this.eventBus.audioTrackAdded.publish({ track: track as HMSRemoteAudioTrack, peer: hmsPeer as HMSRemotePeer })
        : this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, track, hmsPeer);
      this.tracksToProcess.delete(track.trackId);
    });
  };

  private setLayer(track: HMSRemoteVideoTrack, layerUpdate: VideoTrackLayerUpdate) {
    const peer = this.store.getPeerByTrackId(track.trackId);
    if (!peer) {
      return;
    }
    const isDegraded = track.setLayerFromServer(layerUpdate);
    if (isDegraded) {
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_DEGRADED, track, peer);
    } else {
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_RESTORED, track, peer);
    }
  }

  removePeerTracks(hmsPeer: HMSPeer, track: HMSRemoteTrack) {
    const auxiliaryTrackIndex = hmsPeer.auxiliaryTracks.indexOf(track);
    if (auxiliaryTrackIndex > -1) {
      hmsPeer.auxiliaryTracks.splice(auxiliaryTrackIndex, 1);
      HMSLogger.d(this.TAG, 'auxiliary track removed', `${track}`);
    } else {
      if (track.type === HMSTrackType.AUDIO && hmsPeer.audioTrack === track) {
        hmsPeer.audioTrack = undefined;
        HMSLogger.d(this.TAG, 'audio track removed', `${track}`);
      } else if (track.type === HMSTrackType.VIDEO && hmsPeer.videoTrack === track) {
        hmsPeer.videoTrack = undefined;
        HMSLogger.d(this.TAG, 'video track removed', `${track}`);
      }
    }
  }

  private addAudioTrack(hmsPeer: HMSPeer, track: HMSRemoteTrack) {
    if (track.type !== HMSTrackType.AUDIO) {
      return;
    }
    if (track.source === 'regular' && (!hmsPeer.audioTrack || hmsPeer.audioTrack?.trackId === track.trackId)) {
      hmsPeer.audioTrack = track as HMSRemoteAudioTrack;
    } else {
      hmsPeer.auxiliaryTracks.push(track);
    }
    this.store.addTrack(track);
    HMSLogger.d(this.TAG, 'audio track added', `${track}`);
  }

  addVideoTrack(hmsPeer: HMSPeer, track: HMSRemoteTrack) {
    if (track.type !== HMSTrackType.VIDEO) {
      return;
    }
    const remoteTrack = track as HMSRemoteVideoTrack;
    const simulcastDefinitions = this.store.getSimulcastDefinitionsForPeer(hmsPeer, remoteTrack.source!);
    remoteTrack.setSimulcastDefinitons(simulcastDefinitions);
    if (this.addAsPrimaryVideoTrack(hmsPeer, remoteTrack)) {
      if (!hmsPeer.videoTrack) {
        hmsPeer.videoTrack = remoteTrack;
      } else {
        (hmsPeer.videoTrack as HMSRemoteVideoTrack).replaceTrack(remoteTrack);
      }
      this.store.addTrack(hmsPeer.videoTrack);
    } else {
      const index = hmsPeer.auxiliaryTracks.findIndex(track => track.trackId === remoteTrack.trackId);
      if (index === -1) {
        hmsPeer.auxiliaryTracks.push(remoteTrack);
        this.store.addTrack(remoteTrack);
      } else {
        (hmsPeer.auxiliaryTracks[index] as HMSRemoteVideoTrack).replaceTrack(remoteTrack);
        this.store.addTrack(hmsPeer.auxiliaryTracks[index]);
      }
    }
    HMSLogger.d(this.TAG, 'video track added', `${track}`);
  }

  addAsPrimaryVideoTrack(hmsPeer: HMSPeer, track: HMSRemoteTrack) {
    return track.source === 'regular' && (!hmsPeer.videoTrack || hmsPeer.videoTrack?.trackId === track.trackId);
  }

  private processTrackUpdate(track: HMSRemoteTrack, currentTrackState: TrackState, trackState: TrackState) {
    let eventType;
    if (currentTrackState.mute !== trackState.mute) {
      eventType = trackState.mute ? HMSTrackUpdate.TRACK_MUTED : HMSTrackUpdate.TRACK_UNMUTED;
      track.type === HMSTrackType.AUDIO &&
        this.eventBus.audioTrackUpdate.publish({ track: track as HMSRemoteAudioTrack, enabled: !trackState.mute });
    } else if (currentTrackState.description !== trackState.description) {
      eventType = HMSTrackUpdate.TRACK_DESCRIPTION_CHANGED;
    }
    return eventType;
  }
}
