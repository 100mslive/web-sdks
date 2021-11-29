import { PeerConnectionType } from '../transport/ITransport';

export class HMSPeerConnectionStats {
  private packetsLost: number = 0;
  private jitter: number = 0;
  private rawStatsArray: RTCStats[] = [];

  constructor(public type: PeerConnectionType, private rawStats: RTCStatsReport) {
    /**
     * @TODO Instead of traversing through all stats to get packetsLost, jitter, etc.,
     * filter for those stat types which have these properties.
     *
     * Stat type -> properties can be found here: https://www.w3.org/TR/webrtc-stats/#summary
     */
    this.rawStats.forEach((r) => {
      if (r.packetsLost) this.packetsLost += r.packetsLost;
      if (r.jitter) this.jitter += r.jitter;
      this.rawStatsArray.push(r);
    });
    // console.log(
    //   'Stats',
    //   type,
    //   this,
    //   this.rawStatsArray.map((r) => [r.type, r.id, r]),
    // );
  }

  getPacketsLost() {
    return this.packetsLost;
  }

  getJitter() {
    return this.jitter;
  }

  getTrackStats(trackId: string) {
    // Get track stats by filtering using trackIdentifer
    const trackStats = this.rawStatsArray.find(
      // @ts-expect-error
      (rawStat) => rawStat.type === 'track' && rawStat.trackIdentifier === trackId,
    );

    // The 'id' of the trackStats should match the trackId of the 'inbound-rtp' streamStats
    const streamStats =
      trackStats &&
      this.rawStatsArray.find(
        (rawStat) =>
          // @ts-expect-error
          (rawStat.type === 'inbound-rtp' || rawStat.type === 'outbound-rtp') && rawStat.trackId === trackStats.id,
      );

    return trackStats && streamStats && Object.assign({}, streamStats, trackStats);
  }

  getLocalPeerStats(): RTCStats | undefined {
    let activeCandidatePair: RTCStats | undefined;
    this.rawStats.forEach((report) => {
      if (report.type === 'transport') {
        // TS doesn't have correct types for RTCStatsReports
        // @ts-expect-error
        activeCandidatePair = this.rawStats.get(report.selectedCandidatePairId);
      }
    });
    // Fallback for Firefox.
    if (!activeCandidatePair) {
      this.rawStats.forEach((report) => {
        if (report.type === 'candidate-pair' && report.selected) {
          activeCandidatePair = report;
        }
      });
    }

    return activeCandidatePair;
  }
}

export class HMSWebrtcStats {
  private publishStats: HMSPeerConnectionStats;
  private subscribeStats: HMSPeerConnectionStats;
  constructor(rawStats: Record<PeerConnectionType, RTCStatsReport>) {
    this.publishStats = new HMSPeerConnectionStats('publish', rawStats.publish);
    this.subscribeStats = new HMSPeerConnectionStats('subscribe', rawStats.subscribe);
  }

  getSubscribeStats() {
    return this.subscribeStats;
  }

  getPublishStats() {
    return this.publishStats;
  }

  getPacketsLost() {
    return this.subscribeStats.getPacketsLost();
  }

  getJitter() {
    return this.subscribeStats.getJitter();
  }

  getLocalPeerStats() {
    return this.subscribeStats.getLocalPeerStats();
  }

  getTrackStats(trackId: string): RTCStats | undefined {
    return this.subscribeStats.getTrackStats(trackId) || this.publishStats.getTrackStats(trackId);
  }
}
