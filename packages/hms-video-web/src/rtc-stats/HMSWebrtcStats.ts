import { IStore } from '../sdk/store';
import { PeerConnectionType, HMSPeerStats, HMSTrackStats } from '../interfaces/webrtc-stats';
import {
  union,
  computeNumberRate,
  getTrackStats,
  getLocalPeerStatsFromReport,
  getPacketsLostAndJitterFromReport,
} from './utils';
import HMSLogger from '../utils/logger';

export class HMSWebrtcStats {
  private readonly TAG = '[HMSWebrtcStats]';
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
  async updateStats() {
    await this.updateLocalPeerStats();
    await this.updateTrackStats();
  }

  private async updateLocalPeerStats() {
    if (!this.localPeerID) {
      return;
    }

    const prevLocalPeerStats = this.getLocalPeerStats();
    let publishReport: RTCStatsReport | undefined;
    try {
      publishReport = await this.getStats.publish?.();
    } catch (err) {
      HMSLogger.w(this.TAG, 'Error in getting publish stats', err);
    }
    const publishStats: HMSPeerStats['publish'] | undefined =
      publishReport && getLocalPeerStatsFromReport('publish', publishReport, prevLocalPeerStats);

    let subscribeReport: RTCStatsReport | undefined;
    try {
      subscribeReport = await this.getStats.subscribe?.();
    } catch (err) {
      HMSLogger.w(this.TAG, 'Error in getting subscribe stats', err);
    }
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

  private async updateTrackStats() {
    const tracks = this.store.getTracksMap();
    const trackIDs = union(Object.keys(this.trackStats), Object.keys(tracks));
    for (const trackID of trackIDs) {
      const track = tracks[trackID];
      if (track) {
        const peerName = track.peerId && this.store.getPeerById(track.peerId)?.name;
        const prevTrackStats = this.getTrackStats(track.trackId);
        const trackStats = await getTrackStats(this.getStats, track, peerName, prevTrackStats);
        if (trackStats) {
          this.trackStats[trackID] = trackStats;
        }
      } else {
        delete this.trackStats[trackID];
      }
    }
  }
}
