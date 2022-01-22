import { HMSTrack, HMSLocalAudioTrack, HMSLocalVideoTrack, HMSLocalTrack } from 'index';
import { HMSPeerStats, HMSTrackStats, PeerConnectionType, RTCTrackStats } from '../interfaces/webrtc-stats';
import { isPresent } from '../utils/validations';
import { HMSWebrtcStats } from './HMSWebrtcStats';

const TRACK_STATS_TO_FILER = ['track', 'inbound-rtp', 'outbound-rtp']; // 'remote-inbound-rtp', 'remote-outbound-rtp'];

export const getTrackStatsFromReport = async (
  getStats: HMSWebrtcStats['getStats'],
  track: HMSTrack,
  peerName?: string,
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
    prevStats && prevStats.getTrackStats(track.trackId),
  );

  return Object.assign(trackStats, {
    bitrate,
    peerId: track.peerId,
    peerName,
  });
};

export const getLocalPeerStatsFromReport = (
  type: PeerConnectionType,
  report: RTCStatsReport,
  prevStats?: HMSPeerStats,
): (RTCIceCandidatePairStats & { bitrate: number }) | undefined => {
  const activeCandidatePair = getActiveCandidatePairFromReport(report);
  const bitrate = computeBitrate(
    (type === 'publish' ? 'bytesSent' : 'bytesReceived') as any,
    activeCandidatePair,
    prevStats && prevStats[type],
  );

  return activeCandidatePair && Object.assign(activeCandidatePair, { bitrate });
};

export const getActiveCandidatePairFromReport = (report: RTCStatsReport): RTCIceCandidatePairStats | undefined => {
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

export const getPacketsLostAndJitterFromReport = (report?: RTCStatsReport): { packetsLost: number; jitter: number } => {
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

export const union = <T>(arr1: T[], arr2: T[]): T[] => {
  const set: Set<T> = new Set();
  for (const elem of arr1) {
    set.add(elem);
  }
  for (const elem of arr2) {
    set.add(elem);
  }
  return Array.from(set);
};

/**
 * Ref: https://github.dev/peermetrics/webrtc-stats/blob/b5c1fed68325543e6f563c6d3f4450a4b51e12b7/src/utils.ts#L62
 */
export const computeBitrate = <T extends RTCIceCandidatePairStats | RTCTrackStats>(
  statName: keyof T,
  newReport?: T,
  oldReport?: T,
): number => computeStatRate(statName, newReport, oldReport) * 8; // Bytes to bits

const computeStatRate = <T extends RTCIceCandidatePairStats | RTCTrackStats>(
  statName: keyof T,
  newReport?: T,
  oldReport?: T,
): number => {
  const newVal = newReport && newReport[statName];
  const oldVal = oldReport ? oldReport[statName] : null;
  if (newReport && oldReport && isPresent(newVal) && isPresent(oldVal)) {
    // Type not null checked in `isPresent`
    // * 1000 - ms to s
    return (
      computeNumberRate(
        newVal as unknown as number,
        oldVal as unknown as number,
        newReport.timestamp,
        oldReport.timestamp,
      ) * 1000
    );
  } else {
    return 0;
  }
};

export const computeNumberRate = (newVal?: number, oldVal?: number, newTimestamp?: number, oldTimestamp?: number) => {
  if (isPresent(newVal) && isPresent(oldVal) && newTimestamp && oldTimestamp) {
    return ((newVal as number) - (oldVal as number)) / (newTimestamp - oldTimestamp);
  } else {
    return 0;
  }
};
