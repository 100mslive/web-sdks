import { IStore } from '../sdk/store';
import { HMSLocalAudioTrack, HMSLocalTrack, HMSLocalVideoTrack, HMSTrack } from '../media/tracks';
import { PeerConnectionType, HMSPeerStats, HMSTrackStats, RTCTrackStats } from '../interfaces/webrtc-stats';
import { computeBitrate, computeNumberRate } from './utils';

const TRACK_STATS_TO_FILER = ['track', 'inbound-rtp', 'outbound-rtp']; // 'remote-inbound-rtp', 'remote-outbound-rtp'];

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
      publishReport && getLocalPeerStats('publish', publishReport, prevLocalPeerStats);

    const subscribeReport = await this.getStats.subscribe?.();
    const baseSubscribeStats = subscribeReport && getLocalPeerStats('subscribe', subscribeReport, prevLocalPeerStats);
    const { packetsLost, jitter } = getPacketsLostAndJitter(subscribeReport);
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
      if (track) {
        this.trackStats[trackID] = await this.generateTrackStats(this.getStats, track, prevStats);
      } else {
        delete this.trackStats[trackID];
      }
    }
  }

  private generateTrackStats = async (
    getStats: HMSWebrtcStats['getStats'],
    track: HMSTrack,
    prevStats?: HMSWebrtcStats,
  ): Promise<HMSTrackStats> => {
    const outbound = track instanceof HMSLocalAudioTrack || track instanceof HMSLocalVideoTrack;
    const peerConnectionType: PeerConnectionType = outbound ? 'publish' : 'subscribe';
    const nativeTrack: MediaStreamTrack = outbound ? (track as HMSLocalTrack).getTrackBeingSent() : track.nativeTrack;
    const trackReport = await getStats[peerConnectionType]?.(nativeTrack);
    const filteredTrackStats: RTCTrackStats[] = [];
    trackReport?.forEach(stat => {
      if (TRACK_STATS_TO_FILER.includes(stat.type)) {
        filteredTrackStats.push(stat);
      }
    });

    const trackStats = Object.assign({}, ...filteredTrackStats);
    const bitrate = computeBitrate(
      (peerConnectionType === 'publish' ? 'bytesSent' : 'bytesReceived') as any,
      trackStats,
      prevStats && prevStats.trackStats[track.trackId],
    );

    return Object.assign(trackStats, {
      bitrate,
      peerId: track.peerId,
      peerName: track.peerId && this.store.getPeerById(track.peerId)?.name,
    });
  };
}

const getLocalPeerStats = (
  type: PeerConnectionType,
  report: RTCStatsReport,
  prevStats?: HMSPeerStats,
): (RTCIceCandidatePairStats & { bitrate: number }) | undefined => {
  const activeCandidatePair = getActiveCandidatePair(report);
  const bitrate = computeBitrate(
    (type === 'publish' ? 'bytesSent' : 'bytesReceived') as any,
    activeCandidatePair,
    prevStats && prevStats[type],
  );

  return activeCandidatePair && Object.assign(activeCandidatePair, { bitrate });
};

const getActiveCandidatePair = (report: RTCStatsReport): RTCIceCandidatePairStats | undefined => {
  let activeCandidatePair: RTCIceCandidatePairStats | undefined;
  report.forEach(stat => {
    if (stat.type === 'transport') {
      // TS doesn't have correct types for RTCStatsReports
      // @ts-expect-error
      activeCandidatePair = report.get(stat.selectedCandidatePairId);
    }
  });

  // Fallback for Firefox.
  if (!activeCandidatePair) {
    report.forEach(stat => {
      if (stat.type === 'candidate-pair' && stat.selected) {
        activeCandidatePair = stat;
      }
    });
  }

  return activeCandidatePair;
};

const getPacketsLostAndJitter = (report?: RTCStatsReport): { packetsLost: number; jitter: number } => {
  const result = { packetsLost: 0, jitter: 0 };
  report?.forEach(stat => {
    if (stat.packetsLost) {
      result.packetsLost += stat.packetsLost;
    }
    if (stat.jitter > result.jitter) {
      result.jitter = stat.jitter;
    }
  });

  return result;
};

const union = <T>(arr1: T[], arr2: T[]): T[] => {
  const set: Set<T> = new Set();
  for (const elem of arr1) {
    set.add(elem);
  }
  for (const elem of arr2) {
    set.add(elem);
  }
  return Array.from(set);
};
