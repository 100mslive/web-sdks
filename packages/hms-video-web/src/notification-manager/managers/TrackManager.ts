import { EventBus } from '../../events/EventBus';
import { HMSPeer, HMSSimulcastLayer, HMSTrackUpdate, HMSUpdateListener } from '../../interfaces';
import { HMSRemoteAudioTrack, HMSRemoteTrack, HMSRemoteVideoTrack, HMSTrackType } from '../../media/tracks';
import { HMSRemotePeer } from '../../sdk/models/peer';
import { IStore } from '../../sdk/store';
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
  private tracksToProcess: Map<string, HMSRemoteTrack> = new Map();

  private get TAG() {
    return `[HMSTrackManager]`;
  }

  constructor(private store: IStore, private eventBus: EventBus, public listener?: HMSUpdateListener) {}

  /**
   * handle track info(track id, corresponding peer, current state etc.) coming
   * in from signalling server
   */
  handleTrackMetadataAdd(params: TrackStateNotification) {
    const peerId = params.peer.peer_id;
    const peerName = params.peer.info?.name;
    HMSLogger.d(this.TAG, `track metadata arrived from signalling - ${peerId}, name- ${peerName}`, params);

    for (const trackId in params.tracks) {
      this.store.setTrackState({
        peerId,
        trackInfo: params.tracks[trackId],
      });
    }

    this.processPendingTracks();
  }

  /**
   * handle track add coming over WebRTC
   */
  handleTrackAdd = (track: HMSRemoteTrack) => {
    HMSLogger.d(this.TAG, `track add from WebRTC - ${track.logIdentifier}`, track, track.nativeTrack);
    this.store.addTrack(track);
    this.tracksToProcess.set(track.trackId, track);
    this.processPendingTracks();
  };

  /**
   * handle track remove coming over WebRTC
   */
  handleTrackRemove = (track: HMSRemoteTrack) => {
    HMSLogger.d(this.TAG, `ONTRACKREMOVE - ${track.logIdentifier}`, track, track.nativeTrack);
    const trackStateEntry = this.store.getTrackState(track.trackId);

    if (!trackStateEntry) {
      return;
    }

    // emit this event here as peer will already be removed(if left the room) by the time this event is received
    track.type === HMSTrackType.AUDIO && this.eventBus.audioTrackRemoved.publish(track as HMSRemoteAudioTrack);
    const hmsPeer = this.store.getPeerById(trackStateEntry.peerId);
    if (!hmsPeer) {
      return;
    }
    this.removePeerTracks(hmsPeer, track);
    this.store.removeTrack(track.trackId);
    this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, track, hmsPeer);
  };

  /**
   * handle track layer changes coming in over WebRTC Data Channel
   * layer can be changed by SFU in case of network degradation.
   */
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
        const isDegraded = this.isTrackDegraded(trackEntry.expected_layer, trackEntry.current_layer);
        track.setLayerFromServer(trackEntry.current_layer, isDegraded);
        if (isDegraded) {
          this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_DEGRADED, track, peer);
        } else {
          this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_RESTORED, track, peer);
        }
      }
    }
  };

  /**
   * handle track metadata update(mute status for e.g.) coming in from signalling srver
   */
  handleTrackUpdate = (params: TrackStateNotification) => {
    const hmsPeer = this.store.getPeerById(params.peer.peer_id);
    if (!hmsPeer) {
      return;
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
        this.processPendingTracks();
      } else {
        track.setEnabled(!trackEntry.mute);
        const eventType = this.processTrackUpdate(track as HMSRemoteTrack, currentTrackStateInfo, trackEntry);
        if (eventType) {
          HMSLogger.d(this.TAG, `event - ${HMSTrackUpdate[eventType]}, track-${track.logIdentifier}`, track);
          this.listener?.onTrackUpdate(eventType, track, hmsPeer);
        }
      }
    }
  };

  /**
   * track is in pending state when one of webrtc add track, signalling track add or peer add hasn't
   * arrived yet. this method is called when any of the above things changes.
   * TODO: currently every time we create a copy of all pending tracks to process and loop
   * TODO: over them. It can be optimised to do it only for information which could have changed.
   */
  processPendingTracks() {
    const tracksCopy = new Map(this.tracksToProcess);

    tracksCopy.forEach(track => {
      const state = this.store.getTrackState(track.trackId);
      if (!state) {
        return;
      }

      const hmsPeer = this.store.getPeerById(state.peerId);
      if (!hmsPeer) {
        return;
      }

      track.source = state.trackInfo.source;
      track.peerId = hmsPeer.peerId;
      // set log identifier to initial name of the peer
      track.logIdentifier = hmsPeer.name;
      track.setEnabled(!state.trackInfo.mute);
      this.addAudioTrack(hmsPeer, track);
      this.addVideoTrack(hmsPeer, track);
      HMSLogger.d(this.TAG, `TRACK_ADDED - ${track.logIdentifier}`, track);
      /**
       * Don't call onTrackUpdate for audio elements immediately because the operations(eg: setVolume) performed
       * on onTrackUpdate can be override in AudioSinkManager when audio element is created
       **/
      track.type === HMSTrackType.AUDIO
        ? this.eventBus.audioTrackAdded.publish({ track: track as HMSRemoteAudioTrack, peer: hmsPeer as HMSRemotePeer })
        : this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, track, hmsPeer);
      this.tracksToProcess.delete(track.trackId);
    });
  }

  private removePeerTracks(hmsPeer: HMSPeer, track: HMSRemoteTrack) {
    const auxiliaryTrackIndex = hmsPeer.auxiliaryTracks.indexOf(track);
    if (auxiliaryTrackIndex > -1) {
      hmsPeer.auxiliaryTracks.splice(auxiliaryTrackIndex, 1);
    } else {
      if (track.type === HMSTrackType.AUDIO && hmsPeer.audioTrack?.trackId === track.trackId) {
        hmsPeer.audioTrack = undefined;
      } else if (track.type === HMSTrackType.VIDEO && hmsPeer.videoTrack?.trackId === track.trackId) {
        hmsPeer.videoTrack = undefined;
      }
    }
  }

  private addAudioTrack(hmsPeer: HMSPeer, track: HMSRemoteTrack) {
    if (track.type !== HMSTrackType.AUDIO) {
      return;
    }
    if (!hmsPeer.audioTrack && track.source === 'regular') {
      hmsPeer.audioTrack = track as HMSRemoteAudioTrack;
    } else {
      hmsPeer.auxiliaryTracks.push(track);
    }
  }

  private addVideoTrack(hmsPeer: HMSPeer, track: HMSRemoteTrack) {
    if (track.type !== HMSTrackType.VIDEO) {
      return;
    }
    const remoteTrack = track as HMSRemoteVideoTrack;
    const simulcastDefinitions = this.store.getSimulcastDefinitionsForPeer(hmsPeer, remoteTrack.source!);
    remoteTrack.setSimulcastDefinitons(simulcastDefinitions);
    if (!hmsPeer.videoTrack && track.source === 'regular') {
      hmsPeer.videoTrack = remoteTrack;
    } else {
      hmsPeer.auxiliaryTracks.push(remoteTrack);
    }
  }

  private processTrackUpdate(track: HMSRemoteTrack, currentTrackState: TrackState, trackState: TrackState) {
    let eventType;
    track.setEnabled(!trackState.mute);
    if (currentTrackState.mute !== trackState.mute) {
      eventType = trackState.mute ? HMSTrackUpdate.TRACK_MUTED : HMSTrackUpdate.TRACK_UNMUTED;
      track.type === HMSTrackType.AUDIO &&
        this.eventBus.audioTrackUpdate.publish({ track: track as HMSRemoteAudioTrack, enabled: !trackState.mute });
    } else if (currentTrackState.description !== trackState.description) {
      eventType = HMSTrackUpdate.TRACK_DESCRIPTION_CHANGED;
    }
    return eventType;
  }

  /**
   * track is degraded if newLayer is worse than prev layer
   */
  private isTrackDegraded(prevLayer: HMSSimulcastLayer, newLayer: HMSSimulcastLayer): boolean {
    const toInt = (layer: HMSSimulcastLayer): number => {
      switch (layer) {
        case HMSSimulcastLayer.HIGH:
          return 3;
        case HMSSimulcastLayer.MEDIUM:
          return 2;
        case HMSSimulcastLayer.LOW:
          return 1;
        case HMSSimulcastLayer.NONE:
          return 0;
      }
    };

    return toInt(newLayer) < toInt(prevLayer);
  }
}
