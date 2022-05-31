import { HMSTrack, HMSLocalTrack } from '../media/tracks';
import {
  HMSPeerStats,
  HMSTrackStats,
  PeerConnectionType,
  RTCRemoteInboundRtpStreamStats,
} from '../interfaces/webrtc-stats';
import { isPresent } from '../utils/validations';
import { HMSWebrtcStats } from './HMSWebrtcStats';
import HMSLogger from '../utils/logger';
import HMSLocalStream from '../media/streams/HMSLocalStream';

const getTrackAndConnectionType = (track: HMSTrack) => {
  const outbound = track.stream instanceof HMSLocalStream;
  const peerConnectionType: PeerConnectionType = outbound ? 'publish' : 'subscribe';
  const nativeTrack: MediaStreamTrack = outbound ? (track as HMSLocalTrack).getTrackBeingSent() : track.nativeTrack;
  return { peerConnectionType, nativeTrack };
};

export const getTrackStats = async (
  getStats: HMSWebrtcStats['getStats'],
  track: HMSTrack,
  peerName?: string,
  prevTrackStats?: HMSTrackStats,
): Promise<HMSTrackStats | undefined> => {
  const { peerConnectionType, nativeTrack } = getTrackAndConnectionType(track);
  let trackReport: RTCStatsReport | undefined;
  try {
    trackReport = await getStats[peerConnectionType]?.(nativeTrack);
  } catch (err) {
    HMSLogger.w('[HMSWebrtcStats]', 'Error in getting track stats', track, nativeTrack, err);
  }
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
      codec: trackStats.codec,
    })
  );
};

const getRelevantStatsFromTrackReport = (trackReport?: RTCStatsReport) => {
  let streamStats: RTCInboundRtpStreamStats | RTCOutboundRtpStreamStats | undefined;
  // Valid by Webrtc spec, not in TS
  // let remoteStreamStats: RTCRemoteInboundRtpStreamStats | RTCRemoteOutboundRtpStreamStats;
  let remoteStreamStats: RTCRemoteInboundRtpStreamStats | undefined;

  const mimeTypes: { [key: string]: string } = {}; // codecId -> mimeType
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
      case 'codec':
        mimeTypes[stat.id] = stat.mimeType;
        break;
      default:
        break;
    }
  });

  const mimeType = streamStats?.codecId ? mimeTypes[streamStats.codecId] : undefined;
  let codec: string | undefined;
  if (mimeType) {
    codec = mimeType.substring(mimeType.indexOf('/') + 1);
  }

  return (
    streamStats &&
    Object.assign(streamStats, {
      remote: remoteStreamStats,
      codec: codec,
    })
  );
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
  const conditions = [newReport, oldReport, isPresent(newVal), isPresent(oldVal)];
  if (conditions.every(condition => !!condition)) {
    // Type not null checked in `isPresent`
    // * 1000 - ms to s
    return (
      computeNumberRate(
        newVal as unknown as number,
        oldVal as unknown as number,
        newReport?.timestamp,
        oldReport?.timestamp,
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
