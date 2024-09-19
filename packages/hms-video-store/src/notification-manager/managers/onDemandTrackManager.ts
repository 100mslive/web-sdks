import { TrackManager } from './TrackManager';
import { EventBus } from '../../events/EventBus';
import { HMSPeer, HMSTrackUpdate, HMSUpdateListener } from '../../interfaces';
import { HMSRemoteStream } from '../../media/streams/HMSRemoteStream';
import { HMSRemoteTrack, HMSRemoteVideoTrack } from '../../media/tracks';
import { LocalTrackManager } from '../../sdk/LocalTrackManager';
import { Store } from '../../sdk/store';
import HMSTransport from '../../transport';
import HMSLogger from '../../utils/logger';
import { isEmptyTrack } from '../../utils/track';
import { TrackState, TrackStateNotification } from '../HMSNotifications';

export class OnDemandTrackManager extends TrackManager {
  TAG = '[OnDemandTrackManager]';

  constructor(store: Store, eventBus: EventBus, private transport: HMSTransport, listener?: HMSUpdateListener) {
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

  handleTrackRemove(track: HMSRemoteTrack) {
    const isRegularVideo = track.type === 'video' && track.source === 'regular';
    super.handleTrackRemove(track, !isRegularVideo);
    if (isRegularVideo) {
      this.processTrackInfo(
        {
          track_id: track.trackId,
          mute: !track.enabled,
          type: track.type,
          source: track.source,
          stream_id: track.stream.id,
        } as TrackState,
        track.peerId!,
        false,
      );
    }
  }

  /**
   * Add a blank track for the track received from biz so that the UI can render and show video element
   * which will trigger the prefer-video-track-state request which results in the actual track being
   * received from the sfu.
   * This will also be called when track is removed, as it can be removed when none is sent to sfu to
   * reduce the overall offer size
   * @param {TrackState} trackInfo
   * @param {string} peerId
   * @param {boolean} callListener
   * @returns
   */
  processTrackInfo = (trackInfo: TrackState, peerId: string, callListener = true) => {
    if (trackInfo.type !== 'video') {
      return;
    }
    const hmsPeer = this.store.getPeerById(peerId);
    if (!hmsPeer || !this.isPeerRoleSubscribed(peerId)) {
      HMSLogger.d(this.TAG, `no peer in store for peerId: ${peerId}`);
      return;
    }
    const remoteStream = new HMSRemoteStream(new MediaStream(), this.transport.getSubscribeConnection()!);
    const emptyTrack = LocalTrackManager.getEmptyVideoTrack();
    emptyTrack.enabled = !trackInfo.mute;
    const track = new HMSRemoteVideoTrack(
      remoteStream,
      emptyTrack,
      trackInfo.source,
      this.store.getRoom()?.disableNoneLayerRequest,
    );
    track.setTrackId(trackInfo.track_id);
    track.peerId = hmsPeer.peerId;
    track.logIdentifier = hmsPeer.name;
    this.addVideoTrack(hmsPeer, track);
    if (callListener) {
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, hmsPeer.videoTrack!, hmsPeer);
    }
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

  private isPeerRoleSubscribed(peerId?: string) {
    if (!peerId) {
      return true;
    }
    const localPeer = this.store.getLocalPeer();
    const peer = this.store.getPeerById(peerId);
    return peer && localPeer?.role?.subscribeParams?.subscribeToRoles?.includes(peer.role?.name!);
  }
}
