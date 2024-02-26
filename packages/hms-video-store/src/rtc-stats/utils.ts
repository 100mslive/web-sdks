import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import { EventBus } from '../events/EventBus';
import { RID } from '../interfaces';
import {
  HMSLocalTrackStats,
  HMSPeerStats,
  HMSTrackStats,
  MissingInboundStats,
  PeerConnectionType,
  RTCRemoteInboundRtpStreamStats,
} from '../interfaces/webrtc-stats';
import { HMSLocalTrack, HMSRemoteTrack } from '../media/tracks';
import HMSLogger from '../utils/logger';
import { isPresent } from '../utils/validations';

export const getLocalTrackStats = async (
  eventBus: EventBus,
  track: HMSLocalTrack,
  peerName?: string,
  prevTrackStats?: Record<string, HMSTrackStats>,
): Promise<Record<string, HMSTrackStats> | undefined> => {
  let trackReport: RTCStatsReport | undefined;
  const trackStats: Record<string, HMSTrackStats> = {};
  if (!track.transceiver?.sender.track) {
    return;
  }
  try {
    trackReport = await track.transceiver.sender.getStats();
    const mimeTypes: { [key: string]: string } = {}; // codecId -> mimeType
    const outbound: Record<string, RTCOutboundRtpStreamStats> = {};
    const inbound: Record<string, RTCInboundRtpStreamStats & MissingInboundStats> = {};
    trackReport?.forEach(stat => {
      switch (stat.type) {
        case 'outbound-rtp':
          outbound[stat.id] = stat;
          break;
        case 'remote-inbound-rtp':
          inbound[stat.ssrc] = stat;
          break;
        case 'codec':
          mimeTypes[stat.id] = stat.mimeType;
          break;
        default:
          break;
      }
    });

    Object.keys({ ...outbound }).forEach(stat => {
      const codecId = outbound[stat]?.codecId;
      const mimeType = codecId ? mimeTypes[codecId] : undefined;
      let codec: string | undefined;
      if (mimeType) {
        codec = mimeType.substring(mimeType.indexOf('/') + 1);
      }
      const out = { ...outbound[stat], rid: (outbound[stat] as HMSLocalTrackStats)?.rid as RID | undefined };
      const inStats = inbound[out.ssrc];
      trackStats[stat] = {
        ...out,
        bitrate: computeBitrate('bytesSent', out, prevTrackStats?.[stat]),
        packetsLost: inStats?.packetsLost,
        jitter: inStats?.jitter,
        roundTripTime: inStats?.roundTripTime,
        totalRoundTripTime: inStats?.totalRoundTripTime,
        peerName,
        peerID: track.peerId,
        enabled: track.enabled,
        codec,
      };
    });
  } catch (err: any) {
    eventBus.analytics.publish(
      AnalyticsEventFactory.rtcStatsFailed(
        ErrorFactory.WebrtcErrors.StatsFailed(
          HMSAction.TRACK,
          `Error getting local track stats ${track.trackId} - ${err.message}`,
        ),
      ),
    );
    HMSLogger.w('[HMSWebrtcStats]', 'Error in getting local track stats', track, err, (err as Error).name);
  }
  return trackStats;
};

export const getTrackStats = async (
  eventBus: EventBus,
  track: HMSRemoteTrack,
  peerName?: string,
  prevTrackStats?: HMSTrackStats,
): Promise<HMSTrackStats | undefined> => {
  let trackReport: RTCStatsReport | undefined;
  try {
    trackReport = await track.transceiver?.receiver.getStats();
  } catch (err: any) {
    eventBus.analytics.publish(
      AnalyticsEventFactory.rtcStatsFailed(
        ErrorFactory.WebrtcErrors.StatsFailed(
          HMSAction.TRACK,
          `Error getting remote track stats ${track.trackId} - ${err.message}`,
        ),
      ),
    );
    HMSLogger.w('[HMSWebrtcStats]', 'Error in getting remote track stats', track, err);
  }
  const trackStats = getRelevantStatsFromTrackReport(trackReport);

  const bitrate = computeBitrate('bytesReceived', trackStats, prevTrackStats);

  const packetsLostRate = computeStatRate('packetsLost', trackStats, prevTrackStats);

  if (trackStats?.remote) {
    Object.assign(trackStats.remote, {
      packetsLostRate: computeStatRate('packetsLost', trackStats.remote, prevTrackStats?.remote),
    });
  }

  return (
    trackStats && {
      ...trackStats,
      bitrate,
      packetsLostRate,
      peerID: track.peerId,
      enabled: track.enabled,
      peerName,
      codec: trackStats.codec,
    }
  );
};

const getRelevantStatsFromTrackReport = (trackReport?: RTCStatsReport) => {
  let streamStats: RTCInboundRtpStreamStats | (RTCOutboundRtpStreamStats & { rid?: RID }) | undefined;
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
  report?: RTCStatsReport,
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

export const getActiveCandidatePairFromReport = (report?: RTCStatsReport): RTCIceCandidatePairStats | undefined => {
  let activeCandidatePair: RTCIceCandidatePairStats | undefined;
  report?.forEach(stat => {
    if (stat.type === 'transport') {
      // TS doesn't have correct types for RTCStatsReports
      // @ts-expect-error
      activeCandidatePair = report?.get(stat.selectedCandidatePairId);
    }
  });

  // Fallback for Firefox.
  if (!activeCandidatePair) {
    report?.forEach(stat => {
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
