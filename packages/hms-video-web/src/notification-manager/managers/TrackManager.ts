import { VideoTrackLayerUpdate } from '../../connection/channel-messages';
import { EventBus } from '../../events/EventBus';
import { HMSPeer, HMSTrackUpdate, HMSUpdateListener } from '../../interfaces';
import { HMSRemoteStream } from '../../media/streams';
import { HMSRemoteAudioTrack, HMSRemoteTrack, HMSRemoteVideoTrack, HMSTrackType, RtcTrack } from '../../media/tracks';
import { LocalTrackManager } from '../../sdk/LocalTrackManager';
import { IStore } from '../../sdk/store';
import HMSTransport from '../../transport';
import HMSLogger from '../../utils/logger';
import { isEmptyTrack } from '../../utils/track';
import {
  OnPipeAllocateNotification,
  OnTrackLayerUpdateNotification,
  OnTrackRemoveNotification,
  TrackState,
  TrackStateNotification,
} from '../HMSNotifications';

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

  private allocation: OnPipeAllocateNotification = { tracks: {} };
  private readonly rtcTracks: Map<string, RtcTrack> = new Map();

  constructor(
    public store: IStore,
    public eventBus: EventBus,
    protected transport: HMSTransport,
    public listener?: HMSUpdateListener,
  ) {}

  /**
   * Handles biz event 'on-track-add' - initialises empty track such that it's ready for allocation
   * once actual RtcTrack binding is received via 'on-pipe-allocate'
   * @param params TrackStateNotification
   */
  handleTrackMetadataAdd(params: TrackStateNotification) {
    HMSLogger.d(this.TAG, `on-track-add`, params);

    for (const trackId in params.tracks) {
      if (this.store.getTrackState(trackId)) {
        HMSLogger.w(this.TAG, `track-state already in store id:${trackId}`);
        continue;
      }

      const trackInfo = params.tracks[trackId];
      this.store.setTrackState({
        peerId: params.peer.peer_id,
        trackInfo,
      });

      const peer = this.store.getPeerById(params.peer.peer_id);
      if (!peer) {
        HMSLogger.w(this.TAG, `peer not found id:${params.peer.peer_id}, not initialising empty track`, params);
        continue;
      }

      let track: HMSRemoteTrack;
      if (trackInfo.type === 'audio') {
        track = new HMSRemoteAudioTrack(
          new HMSRemoteStream(new MediaStream(), this.transport.getSubscribeConnection()!),
          LocalTrackManager.getEmptyAudioTrack(),
          trackInfo.source,
        );
      } else {
        track = new HMSRemoteVideoTrack(
          new HMSRemoteStream(new MediaStream(), this.transport.getSubscribeConnection()!),
          LocalTrackManager.getEmptyVideoTrack(),
          trackInfo.source,
        );

        track.source = trackInfo.source;
        track.peerId = peer.peerId;
        track.logIdentifier = peer.name;
      }

      track.setEnabled(!trackInfo.mute);
      track.setTrackId(trackInfo.track_id);
      track.setSdpTrackId(trackInfo.track_id);
      this.store.addTrack(track);

      if (track.type === HMSTrackType.AUDIO) {
        this.addAudioTrack(peer, track);
        this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, peer.audioTrack!, peer);
      } else {
        this.addVideoTrack(peer, track);
        this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, peer.videoTrack!, peer);
      }
    }
  }

  handleTrackUpdate = (params: TrackStateNotification) => {
    HMSLogger.d(this.TAG, 'on-track-update', params);

    const peer = this.store.getPeerById(params.peer.peer_id);
    if (!peer) {
      HMSLogger.d(this.TAG, `on-track-update ignored - Peer not added to store`, params);
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

      if (track) {
        track.setEnabled(!trackEntry.mute);
        const eventType = this.processTrackUpdate(track as HMSRemoteTrack, currentTrackStateInfo, trackEntry);
        if (eventType) {
          this.listener?.onTrackUpdate(eventType, track, peer);
        }
      } else {
        // fixme(aditya): on-track-add received after on-track-update
        HMSLogger.w(this.TAG, `on-track-update received before on-track-add track-id:${trackId}`, trackEntry);
        this.allocateTracks();
      }
    }
  };

  /**
   * Sets the tracks to peer and returns the peer
   */
  handleTrackAdd = (track: RtcTrack) => {
    HMSLogger.d(this.TAG, `rtc track-add`, track);
    this.rtcTracks.set(track.id, track);

    // fixme(aditya): optimise by not calling allocateTrack always
    this.allocateTracks();
  };

  /**
   * Sets the track of corresponding peer to null and returns the peer
   *
   * todo(aditya): cleanup respective bound HMSTrack (if exist)
   */
  handleTrackRemove(id: string): boolean {
    HMSLogger.d(this.TAG, `rtc track-remove ${id}`);
    this.rtcTracks.delete(id);
    return true;
  }

  handlePipeAllocate = (params: OnPipeAllocateNotification) => {
    this.allocation = params;
    this.allocateTracks();
  };

  handleBizTrackRemove = (params: OnTrackRemoveNotification) => {
    for (const track_id in params.tracks) {
      const track = this.store.getTrackById(track_id) as HMSRemoteTrack | undefined;
      if (!track) {
        HMSLogger.w(this.TAG, `track not found in store id:${track_id}`);
        continue;
      }

      if (track.type === HMSTrackType.AUDIO) {
        this.eventBus.audioTrackRemoved.publish(track as HMSRemoteAudioTrack);
      }
      this.store.removeTrack(track);

      const peer = this.store.getPeerById(track.peerId!);
      if (!peer) {
        HMSLogger.w(this.TAG, `peer not found in store track_id:${track_id} peer_id:${track.peerId}`);
        continue;
      }

      this.removePeerTracks(peer, track);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_REMOVED, track, peer);
    }
  };

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

  allocateTracks = () => {
    const tracks = new Map(this.rtcTracks);
    const allocation = this.allocation;

    let added = 0;
    let same = 0;
    let removed = 0;

    // eslint-disable-next-line complexity
    tracks.forEach(rtcTrack => {
      const bizTrackId = allocation.tracks[rtcTrack.id];
      const warnPrefix = `allocate tracks ${rtcTrack.id}:${bizTrackId}`;

      if (rtcTrack.assignedBizTrackId && rtcTrack.assignedBizTrackId !== bizTrackId) {
        // track is de-allocated, check if this native-track is assigned to some HMSTrack
        const track = this.store.getTrackById(rtcTrack.assignedBizTrackId) as HMSRemoteTrack | undefined;
        if (track) {
          track.transceiver = undefined;
          if (track.type === HMSTrackType.AUDIO) {
            track.nativeTrack = LocalTrackManager.getEmptyAudioTrack();
          } else {
            track.nativeTrack = LocalTrackManager.getEmptyVideoTrack();
          }

          const state = this.store.getTrackState(rtcTrack.assignedBizTrackId!);
          if (state) {
            track.setEnabled(!state.trackInfo.mute);
          }
        }

        rtcTrack.assignedBizTrackId = undefined;
        removed++;

        if (!bizTrackId) {
          // track was simply de-allocated
          return;
        }
      } else if (rtcTrack.assignedBizTrackId === bizTrackId) {
        // already assigned; skip below changes
        same++;
        return;
      }

      const track = this.store.getTrackById(bizTrackId) as HMSRemoteTrack | undefined;
      if (!track) {
        HMSLogger.w(this.TAG, `${warnPrefix} - track not in store`);
        return;
      }

      const state = this.store.getTrackState(bizTrackId);
      if (!state) {
        HMSLogger.w(this.TAG, `${warnPrefix} - track state not in store`);
        return;
      }

      const peer = this.store.getPeerById(state.peerId);
      if (!peer) {
        HMSLogger.w(this.TAG, `${warnPrefix} - peer not in store`);
        return;
      }

      track.transceiver = rtcTrack.transceiver;
      track.nativeTrack = rtcTrack.track;
      rtcTrack.assignedBizTrackId = state.trackInfo.track_id;
      track.setEnabled(!state.trackInfo.mute);

      if (track.type === HMSTrackType.AUDIO) {
        this.addAudioTrack(peer, track);
      } else {
        this.addVideoTrack(peer, track);
      }

      added++;
    });
    HMSLogger.i(this.TAG, `allocate tracks same:${same} added:${added} removed:${removed}`, allocation, tracks);
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
      HMSLogger.d(this.TAG, 'auxiliary track removed', track);
    } else {
      if (track.type === HMSTrackType.AUDIO && hmsPeer.audioTrack === track) {
        hmsPeer.audioTrack = undefined;
        HMSLogger.d(this.TAG, 'audio track removed', track);
      } else if (track.type === HMSTrackType.VIDEO && hmsPeer.videoTrack === track) {
        hmsPeer.videoTrack = undefined;
        HMSLogger.d(this.TAG, 'video track removed', track);
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

    HMSLogger.d(this.TAG, `audio track added id:${track.trackId} enabled:${track.enabled}`);
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
        (hmsPeer.videoTrack as HMSRemoteVideoTrack).replaceTrack(remoteTrack.nativeTrack);
      }
    } else {
      const index = hmsPeer.auxiliaryTracks.findIndex(track => track.trackId === remoteTrack.trackId);
      if (index === -1) {
        hmsPeer.auxiliaryTracks.push(remoteTrack);
      } else {
        hmsPeer.auxiliaryTracks.splice(index, 1, remoteTrack);
      }
    }

    HMSLogger.d(this.TAG, `video track added id:${track.trackId} enabled:${track.enabled}`);
  }

  addAsPrimaryVideoTrack(hmsPeer: HMSPeer, track: HMSRemoteTrack) {
    if (track.source !== 'regular') {
      return false;
    }
    if (!hmsPeer.videoTrack) {
      return true;
    }
    if (hmsPeer.videoTrack.trackId === track.trackId) {
      return true;
    }
    return hmsPeer.videoTrack.enabled && isEmptyTrack(hmsPeer.videoTrack.nativeTrack);
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
