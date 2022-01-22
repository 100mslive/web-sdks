import { IStore } from '../sdk/store';
import { PeerConnectionType, HMSPeerStats, HMSTrackStats } from '../interfaces/webrtc-stats';
import {
  union,
  computeNumberRate,
  getTrackStatsFromReport,
  getLocalPeerStatsFromReport,
  getPacketsLostAndJitterFromReport,
} from './utils';

export class HMSWebrtcStats {
  private localPeerID?: string;
  private peerStats: Record<string, HMSPeerStats> = {};
  private trackStats: Record<string, HMSTrackStats> = {};

  constructor(
    private getStats: Record<PeerConnectionType, RTCPeerConnection['getStats'] | undefined>,
    private store: IStore,
  ) {
    this.localPeerID = this.store.getLocalPeer()?.peerId;
  }

  getLocalPeerStats(): HMSPeerStats | undefined {
    if (!this.localPeerID) {
      return;
    }
    return this.peerStats[this.localPeerID];
  }

  getTrackStats(trackId: string): HMSTrackStats | undefined {
    return this.trackStats[trackId];
  }

  /**
   * @internal
   */
  async updateStats(prevStats?: HMSWebrtcStats) {
    await this.updateLocalPeerStats(prevStats?.getLocalPeerStats());
    await this.updateTrackStats(prevStats);
  }

  private async updateLocalPeerStats(prevLocalPeerStats?: HMSPeerStats) {
    if (!this.localPeerID) {
      return;
    }

    const publishReport = await this.getStats.publish?.();
    const publishStats: HMSPeerStats['publish'] | undefined =
      publishReport && getLocalPeerStatsFromReport('publish', publishReport, prevLocalPeerStats);

    const subscribeReport = await this.getStats.subscribe?.();
    const baseSubscribeStats =
      subscribeReport && getLocalPeerStatsFromReport('subscribe', subscribeReport, prevLocalPeerStats);
    const { packetsLost, jitter } = getPacketsLostAndJitterFromReport(subscribeReport);
    const packetsLostRate = computeNumberRate(
      packetsLost,
      prevLocalPeerStats?.subscribe?.packetsLost,
      baseSubscribeStats?.timestamp,
      prevLocalPeerStats?.subscribe?.timestamp,
    );

    const subscribeStats: HMSPeerStats['subscribe'] =
      baseSubscribeStats && Object.assign(baseSubscribeStats, { packetsLostRate, jitter, packetsLost });

    this.peerStats[this.localPeerID] = { publish: publishStats, subscribe: subscribeStats };
  }

  private async updateTrackStats(prevStats?: HMSWebrtcStats) {
    const tracks = this.store.getTracksMap();
    const trackIDs = union(Object.keys(this.trackStats), Object.keys(tracks));
    for (const trackID of trackIDs) {
      const track = tracks[trackID];
      const peerName = track.peerId && this.store.getPeerById(track.peerId)?.name;
      if (track) {
        this.trackStats[trackID] = await getTrackStatsFromReport(this.getStats, track, peerName, prevStats);
      } else {
        delete this.trackStats[trackID];
      }
    }
  }
}
