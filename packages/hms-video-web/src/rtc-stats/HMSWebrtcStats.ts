import { PeerConnectionType } from '.';

export class HMSPeerConnectionStats {
  packetsLost = 0;
  jitter = 0;
  private rawStatsArray: RTCStats[] = [];

  constructor(
    public type: PeerConnectionType,
    private rawStats: RTCStatsReport,
    private readonly getTrackIDBeingSent: (trackID: string) => string | undefined,
  ) {
    /**
     * @TODO Instead of traversing through all stats to get packetsLost, jitter, etc.,
     * filter for those stat types which have these properties.
     *
     * Stat type -> properties can be found here: https://www.w3.org/TR/webrtc-stats/#summary
     */
    this.rawStats.forEach(r => {
      if (r.packetsLost) {
        this.packetsLost += r.packetsLost;
      }
      if (r.jitter > this.jitter) {
        this.jitter = r.jitter;
      }
      this.rawStatsArray.push(r);
    });
    // console.log(
    //   'Stats',
    //   type,
    //   this,
    //   this.rawStatsArray.map(r => [r.type, r.id, r]),
    // );
  }

  getTrackStats(trackId: string): RTCInboundRtpStreamStats | RTCOutboundRtpStreamStats | undefined {
    const statsTrackId = this.getTrackIDBeingSent(trackId);
    // Get track stats by filtering using trackIdentifer
    const trackStats = this.rawStatsArray.find(
      // @ts-expect-error
      rawStat => rawStat.type === 'track' && rawStat.trackIdentifier === statsTrackId,
    );

    // The 'id' of the trackStats should match the trackId of the 'inbound-rtp' streamStats
    const streamStats =
      trackStats &&
      (this.rawStatsArray.find(
        rawStat =>
          // @ts-expect-error
          (rawStat.type === 'inbound-rtp' || rawStat.type === 'outbound-rtp') && rawStat.trackId === trackStats.id,
      ) as RTCRtpStreamStats);

    return trackStats && streamStats && Object.assign({}, trackStats, streamStats);
  }

  getLocalPeerStats(): RTCIceCandidatePairStats | undefined {
    let activeCandidatePair: RTCIceCandidatePairStats | undefined;
    this.rawStats.forEach(report => {
      if (report.type === 'transport') {
        // TS doesn't have correct types for RTCStatsReports
        // @ts-expect-error
        activeCandidatePair = this.rawStats.get(report.selectedCandidatePairId);
      }
    });
    // Fallback for Firefox.
    if (!activeCandidatePair) {
      this.rawStats.forEach(report => {
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
  constructor(
    rawStats: Record<PeerConnectionType, RTCStatsReport>,
    getTrackIDBeingSent: (trackID: string) => string | undefined,
  ) {
    this.publishStats = new HMSPeerConnectionStats('publish', rawStats.publish, getTrackIDBeingSent);
    this.subscribeStats = new HMSPeerConnectionStats('subscribe', rawStats.subscribe, getTrackIDBeingSent);
  }

  getSubscribeStats() {
    return this.subscribeStats;
  }

  getPublishStats() {
    return this.publishStats;
  }

  getPacketsLost() {
    return this.subscribeStats.packetsLost;
  }

  getJitter() {
    return this.subscribeStats.jitter;
  }

  getLocalPeerStats() {
    return { publish: this.publishStats.getLocalPeerStats(), subscribe: this.subscribeStats.getLocalPeerStats() };
  }

  getTrackStats(trackId: string): RTCRtpStreamStats | undefined {
    return this.subscribeStats.getTrackStats(trackId) || this.publishStats.getTrackStats(trackId);
  }
}
