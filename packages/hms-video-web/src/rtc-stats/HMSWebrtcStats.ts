import {
  computeNumberRate,
  getLocalPeerStatsFromReport,
  getLocalTrackStats,
  getPacketsLostAndJitterFromReport,
  getTrackStats,
  union,
} from './utils';
import { HMSPeerStats, HMSTrackStats, PeerConnectionType } from '../interfaces/webrtc-stats';
import { HMSLocalTrack, HMSRemoteTrack } from '../media/tracks';
import { IStore } from '../sdk/store';
import HMSLogger from '../utils/logger';

export class HMSWebrtcStats {
  private readonly TAG = '[HMSWebrtcStats]';
  private localPeerID?: string;
  private peerStats: Record<string, HMSPeerStats> = {};
  private trackStats: Record<string, HMSTrackStats> = {};
  private localTrackStats: Record<string, Record<string, HMSTrackStats>> = {};

  /**
   * Removed localPeerID check in other places as it will be present before
   * this is initialized
   */
  constructor(
    private getStats: Record<PeerConnectionType, RTCPeerConnection['getStats'] | undefined>,
    private store: IStore,
  ) {
    this.localPeerID = this.store.getLocalPeer()?.peerId;
  }

  getLocalPeerStats(): HMSPeerStats | undefined {
    return this.peerStats[this.localPeerID!];
  }

  getTrackStats(trackId: string): HMSTrackStats | undefined {
    return this.trackStats[trackId];
  }

  getLocalTrackStats() {
    return this.localTrackStats;
  }

  /**
   * @internal
   */
  async updateStats() {
    await this.updateLocalPeerStats();
    await this.updateLocalTrackStats();
    await this.updateTrackStats();
  }

  private async updateLocalPeerStats() {
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

    this.peerStats[this.localPeerID!] = { publish: publishStats, subscribe: subscribeStats };
  }

  private async updateTrackStats() {
    const tracks = this.store.getTracksMap();
    const trackIDs = union(Object.keys(this.trackStats), Object.keys(tracks)).filter(
      trackId => tracks[trackId].peerId !== this.localPeerID,
    );
    for (const trackID of trackIDs) {
      const track = tracks[trackID];
      if (track) {
        const peerName = track.peerId && this.store.getPeerById(track.peerId)?.name;
        const prevTrackStats = this.getTrackStats(track.trackId);
        const trackStats = await getTrackStats(this.getStats, track as HMSRemoteTrack, peerName, prevTrackStats);
        if (trackStats) {
          this.trackStats[trackID] = trackStats;
        }
      } else {
        delete this.trackStats[trackID];
      }
    }
  }

  private async updateLocalTrackStats() {
    const tracks = this.store.getTracksMap();
    const trackIDs = this.store.getLocalPeerTracks().map(track => track.getTrackIDBeingSent());
    for (const trackID of trackIDs) {
      const track = tracks[trackID] as HMSLocalTrack;
      if (track) {
        const peerName = this.store.getLocalPeer()?.name;
        const trackStats = await getLocalTrackStats(this.getStats, track, peerName, this.localTrackStats[trackID]);
        if (trackStats) {
          this.localTrackStats[trackID] = trackStats;
        }
      } else {
        delete this.trackStats[trackID];
      }
    }
  }
}
