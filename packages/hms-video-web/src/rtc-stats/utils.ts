import { HMSTrack, HMSLocalAudioTrack, HMSLocalVideoTrack, HMSLocalTrack } from '../media/tracks';
import {
  HMSPeerStats,
  HMSTrackStats,
  PeerConnectionType,
  RTCRemoteInboundRtpStreamStats,
} from '../interfaces/webrtc-stats';
import { isPresent } from '../utils/validations';
import { HMSWebrtcStats } from './HMSWebrtcStats';

export const getTrackStats = async (
  getStats: HMSWebrtcStats['getStats'],
  track: HMSTrack,
  peerName?: string,
  prevTrackStats?: HMSTrackStats,
): Promise<HMSTrackStats | undefined> => {
  const outbound = track instanceof HMSLocalAudioTrack || track instanceof HMSLocalVideoTrack;
  const peerConnectionType: PeerConnectionType = outbound ? 'publish' : 'subscribe';
  const nativeTrack: MediaStreamTrack = outbound ? (track as HMSLocalTrack).getTrackBeingSent() : track.nativeTrack;

  const trackReport = await getStats[peerConnectionType]?.(nativeTrack);
  const trackStats = getRelevantStatsFromTrackReport(trackReport);

  const bitrate = computeBitrate(
    (peerConnectionType === 'publish' ? 'bytesSent' : 'bytesReceived') as any,
    trackStats,
    prevTrackStats,
  );

  const packetsLostRate = computeStatRate('packetsLost', trackStats, prevTrackStats);

  if (trackStats?.remote) {
    Object.assign(trackStats.remote, {
      packetsLostRate: computeStatRate('packetsLost', trackStats.remote, prevTrackStats?.remote),
    });
  }

  return (
    trackStats &&
    Object.assign(trackStats, {
      bitrate,
      packetsLostRate,
      peerId: track.peerId,
      peerName,
    })
  );
};

const getRelevantStatsFromTrackReport = (trackReport?: RTCStatsReport) => {
  let streamStats: RTCInboundRtpStreamStats | RTCOutboundRtpStreamStats | undefined;
  // Valid by Webrtc spec, not in TS
  // let remoteStreamStats: RTCRemoteInboundRtpStreamStats | RTCRemoteOutboundRtpStreamStats;
  let remoteStreamStats: RTCRemoteInboundRtpStreamStats | undefined;
  trackReport?.forEach(stat => {
    switch (stat.type) {
      case 'inbound-rtp':
        streamStats = stat;
        break;
      case 'outbound-rtp':
        streamStats = stat;
        break;
      case 'remote-inbound-rtp':
        remoteStreamStats = stat;
        break;
      default:
        break;
    }
  });

  return streamStats && Object.assign(streamStats, { remote: remoteStreamStats });
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
  return Array.from(new Set(arr1.concat(arr2)));
};

/**
 * Ref: https://github.dev/peermetrics/webrtc-stats/blob/b5c1fed68325543e6f563c6d3f4450a4b51e12b7/src/utils.ts#L62
 */
export const computeBitrate = <T extends HMSTrackStats>(
  statName: keyof T,
  newReport?: Partial<T>,
  oldReport?: Partial<T>,
): number => computeStatRate(statName, newReport, oldReport) * 8; // Bytes to bits

const computeStatRate = <T extends HMSTrackStats>(
  statName: keyof T,
  newReport?: Partial<T>,
  oldReport?: Partial<T>,
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
