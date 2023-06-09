import { TrackManager } from './TrackManager';
import { EventBus } from '../../events/EventBus';
import { HMSPeer, HMSTrackUpdate, HMSUpdateListener } from '../../interfaces';
import HMSRemoteStream from '../../media/streams/HMSRemoteStream';
import { HMSRemoteTrack, HMSRemoteVideoTrack } from '../../media/tracks';
import { LocalTrackManager } from '../../sdk/LocalTrackManager';
import { IStore } from '../../sdk/store';
import HMSTransport from '../../transport';
import HMSLogger from '../../utils/logger';
import { isEmptyTrack } from '../../utils/track';
import { TrackState, TrackStateNotification } from '../HMSNotifications';

export class OnDemandTrackManager extends TrackManager {
  TAG = '[OnDemandTrackManager]';

  constructor(store: IStore, eventBus: EventBus, private transport: HMSTransport, listener?: HMSUpdateListener) {
    super(store, eventBus, listener);
  }

  handleTrackMetadataAdd(params: TrackStateNotification) {
    super.handleTrackMetadataAdd(params);
    for (const trackId in params.tracks) {
      if (params.tracks[trackId].type === 'video') {
        this.processTrackInfo(params.tracks[trackId], params.peer.peer_id);
      }
    }
  }

  handlePeerRoleUpdate = (hmsPeer: HMSPeer) => {
    const subscribeParams = this.store.getLocalPeer()?.role?.subscribeParams;
    const isAllowedToSubscribe = subscribeParams?.subscribeToRoles.includes(hmsPeer.role?.name!);
    if (!isAllowedToSubscribe) {
      this.store.getPeerTracks(hmsPeer.peerId).forEach(track => {
        this.removePeerTracks(hmsPeer, track as HMSRemoteTrack);
      });
    }
  };

  handleTrackRemove(track: HMSRemoteTrack) {
    const removed = super.handleTrackRemove(track);
    if (removed && track.source === 'regular') {
      this.processTrackInfo(
        {
          track_id: track.trackId,
          mute: !track.enabled,
          type: track.type,
          source: track.source,
          stream_id: track.stream.id,
        } as TrackState,
        track.peerId!,
      );
    }
    return removed;
  }

  processTrackInfo = (trackInfo: TrackState, peerId: string) => {
    if (trackInfo.type !== 'video') {
      return;
    }
    const hmsPeer = this.store.getPeerById(peerId);
    if (!hmsPeer) {
      HMSLogger.d(this.TAG, `no peer in store for peerId: ${peerId}`);
      return;
    }
    const remoteStream = new HMSRemoteStream(new MediaStream(), this.transport.subscribeConnection!);
    const emptyTrack = LocalTrackManager.getEmptyVideoTrack();
    emptyTrack.enabled = !trackInfo.mute;
    const track = new HMSRemoteVideoTrack(remoteStream, emptyTrack, trackInfo.source);
    track.setTrackId(trackInfo.track_id);
    this.addVideoTrack(hmsPeer, track);
    this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, hmsPeer.videoTrack!, hmsPeer);
  };

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
}
