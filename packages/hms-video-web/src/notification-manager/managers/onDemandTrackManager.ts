import { HMSPeer, HMSTrackUpdate, HMSUpdateListener } from '../../interfaces';
import HMSRemoteStream from '../../media/streams/HMSRemoteStream';
import { HMSRemoteTrack, HMSRemoteVideoTrack, HMSTrackType } from '../../media/tracks';
import { LocalTrackManager } from '../../sdk/LocalTrackManager';
import { IStore } from '../../sdk/store';
import { InitFlags } from '../../signal/init/models';
import HMSTransport from '../../transport';
import HMSLogger from '../../utils/logger';
import { isEmptyTrack } from '../../utils/track';
import { TrackState } from '../HMSNotifications';

export class OnDemandTrackManager {
  private readonly TAG = '[OnDemandTrackManager]';

  constructor(private store: IStore, private transport: HMSTransport, public listener?: HMSUpdateListener) {}

  handleTrackUpdate = (trackEntry: TrackState, hmsPeer: HMSPeer) => {
    if (!this.isFeatureEnabled() || trackEntry.type !== 'video') {
      return;
    }
    const track = this.store.getTrackById(trackEntry.track_id);
    if (!track) {
      this.processTrackInfo(trackEntry, hmsPeer.peerId);
      this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, hmsPeer.videoTrack!, hmsPeer);
    }
  };

  processTrackInfo = (trackInfo: TrackState, peerId: string) => {
    if (!this.isFeatureEnabled() || trackInfo.type !== 'video') {
      return;
    }
    const hmsPeer = this.store.getPeerById(peerId);
    if (!hmsPeer) {
      HMSLogger.d(this.TAG, `no peer in store for peerId: ${peerId}`);
      return;
    }
    // @ts-ignore
    const remoteStream = new HMSRemoteStream(new MediaStream(), this.transport.subscribeConnection);
    const emptyTrack = LocalTrackManager.getEmptyVideoTrack();
    emptyTrack.enabled = true;
    const track = new HMSRemoteVideoTrack(remoteStream, emptyTrack, trackInfo.source);
    track.setTrackId(trackInfo.track_id);
    this.addVideoTrack(hmsPeer, track);
  };

  // eslint-disable-next-line complexity
  private addVideoTrack(hmsPeer: HMSPeer, track: HMSRemoteTrack) {
    if (track.type !== HMSTrackType.VIDEO) {
      return;
    }
    const remoteTrack = track as HMSRemoteVideoTrack;
    const simulcastDefinitions = this.store.getSimulcastDefinitionsForPeer(hmsPeer, remoteTrack.source!);
    remoteTrack.setSimulcastDefinitons(simulcastDefinitions);
    if (
      track.source === 'regular' &&
      (!hmsPeer.videoTrack ||
        isEmptyTrack(hmsPeer.videoTrack.nativeTrack) ||
        hmsPeer.videoTrack?.trackId === track.trackId)
    ) {
      hmsPeer.videoTrack = remoteTrack;
    } else {
      const index = hmsPeer.auxiliaryTracks.findIndex(track => track.trackId === remoteTrack.trackId);
      if (index === -1) {
        hmsPeer.auxiliaryTracks.push(remoteTrack);
      } else {
        hmsPeer.auxiliaryTracks.splice(index, 1, remoteTrack);
      }
    }
    HMSLogger.d(this.TAG, 'video track added', `${track}`);
  }

  private isFeatureEnabled() {
    return this.transport.isFlagEnabled(InitFlags.FLAG_ON_DEMAND_TRACKS);
  }
}
