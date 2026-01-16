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
import { HMSLocalTrack, HMSRemoteTrack, HMSTrackType } from '../media/tracks';
import HMSLogger from '../utils/logger';
import { isPresent } from '../utils/validations';

interface MediaSourceStats {
  frames?: number;
  framesPerSecond?: number;
  framesDropped?: number;
  width?: number;
  height?: number;
  timestamp?: DOMHighResTimeStamp;
}

const isVideoMediaSourceStat = (stat: any): boolean => {
  const kind = stat.kind || stat.mediaType;
  return !kind || kind === 'video';
};

const matchesSenderTrack = (stat: any, senderTrackId?: string): boolean => {
  if (!senderTrackId || !stat.trackIdentifier) {
    return true;
  }
  return stat.trackIdentifier === senderTrackId;
};

const extractMediaSourceStats = (stat: any): MediaSourceStats => {
  return {
    frames: stat.frames,
    framesPerSecond: stat.framesPerSecond,
    framesDropped: stat.framesDropped,
    width: stat.width ?? stat.frameWidth,
    height: stat.height ?? stat.frameHeight,
    timestamp: stat.timestamp,
  };
};

const computeSourceFrameRateFromFrames = (
  mediaSourceStats: MediaSourceStats,
  prevTrackStats?: HMSTrackStats,
): number | undefined => {
  if (
    !isPresent(mediaSourceStats.frames) ||
    !isPresent(prevTrackStats?.sourceFrames) ||
    !isPresent(mediaSourceStats.timestamp) ||
    !isPresent(prevTrackStats?.sourceTimestamp)
  ) {
    return undefined;
  }
  return (
    computeNumberRate(
      mediaSourceStats.frames,
      prevTrackStats?.sourceFrames,
      mediaSourceStats.timestamp,
      prevTrackStats?.sourceTimestamp,
    ) * 1000
  );
};

const resolveSourceFramesPerSecond = (
  mediaSourceStats: MediaSourceStats,
  prevTrackStats?: HMSTrackStats,
): number | undefined => {
  if (isPresent(mediaSourceStats.framesPerSecond)) {
    return mediaSourceStats.framesPerSecond;
  }
  return computeSourceFrameRateFromFrames(mediaSourceStats, prevTrackStats);
};

const normalizeQualityLimitationDurations = (
  value?: Record<string, number>,
): { none: number; cpu: number; bandwidth: number; other: number } | undefined => {
  if (!value) {
    return undefined;
  }
  return {
    none: value.none || 0,
    cpu: value.cpu || 0,
    bandwidth: value.bandwidth || 0,
    other: value.other || 0,
  };
};

const getTrackSourceStats = (
  trackReport: RTCStatsReport | undefined,
  track: HMSLocalTrack,
): MediaSourceStats | undefined => {
  if (!trackReport) {
    return undefined;
  }
  const senderTrackId = track.transceiver?.sender?.track?.id;
  for (const stat of trackReport.values()) {
    if (stat.type !== 'track') {
      continue;
    }
    const trackStat = stat as any;
    if (!isVideoMediaSourceStat(trackStat)) {
      continue;
    }
    if (!matchesSenderTrack(trackStat, senderTrackId)) {
      continue;
    }
    return extractMediaSourceStats(trackStat);
  }
  return undefined;
};

const resolveSourceStats = (
  trackReport: RTCStatsReport | undefined,
  track: HMSLocalTrack,
): MediaSourceStats | undefined => {
  return getMediaSourceStats(trackReport, track) || getTrackSourceStats(trackReport, track);
};

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
    const mediaSourceStats = track.type === HMSTrackType.VIDEO ? resolveSourceStats(trackReport, track) : undefined;
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
      const qualityLimitationDurations = normalizeQualityLimitationDurations((out as any).qualityLimitationDurations);
      const outStats = { ...out, qualityLimitationDurations };
      const outboundStats = outStats as Partial<HMSTrackStats>;
      const trackIdentifier =
        (outStats as any).trackIdentifier ?? track.transceiver?.sender?.track?.id ?? track.trackId;
      const inStats = inbound[out.ssrc];
      const sourceStats =
        track.type === HMSTrackType.VIDEO ? buildMediaSourceStats(mediaSourceStats, prevTrackStats?.[stat]) : {};
      trackStats[stat] = {
        ...outStats,
        ...sourceStats,
        trackIdentifier,
        bitrate: computeBitrate('bytesSent', outboundStats, prevTrackStats?.[stat]),
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
  const reportStats = trackStats as Partial<HMSTrackStats> | undefined;

  const bitrate = computeBitrate('bytesReceived', reportStats, prevTrackStats);

  const packetsLostRate = computeStatRate('packetsLost', reportStats, prevTrackStats);

  if (trackStats?.remote) {
    Object.assign(trackStats.remote, {
      packetsLostRate: computeStatRate('packetsLost', trackStats.remote, prevTrackStats?.remote),
    });
  }

  return (
    trackStats && {
      ...trackStats,
      trackIdentifier: (trackStats as any).trackIdentifier ?? track.transceiver?.receiver?.track?.id ?? track.trackId,
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

  if (!streamStats) {
    return undefined;
  }
  const qualityLimitationDurations = normalizeQualityLimitationDurations(
    (streamStats as any).qualityLimitationDurations,
  );
  return Object.assign(streamStats, {
    remote: remoteStreamStats,
    codec: codec,
    ...(qualityLimitationDurations ? { qualityLimitationDurations } : {}),
  });
};

const getMediaSourceStats = (
  trackReport: RTCStatsReport | undefined,
  track: HMSLocalTrack,
): MediaSourceStats | undefined => {
  if (!trackReport) {
    return undefined;
  }
  const senderTrackId = track.transceiver?.sender?.track?.id;
  for (const stat of trackReport.values()) {
    if (stat.type !== 'media-source') {
      continue;
    }
    const mediaStat = stat as any;
    if (!isVideoMediaSourceStat(mediaStat)) {
      continue;
    }
    if (!matchesSenderTrack(mediaStat, senderTrackId)) {
      continue;
    }
    return extractMediaSourceStats(mediaStat);
  }
  return undefined;
};

const buildMediaSourceStats = (
  mediaSourceStats: MediaSourceStats | undefined,
  prevTrackStats?: HMSTrackStats,
): Partial<HMSLocalTrackStats> => {
  return {
    sourceFrameWidth: mediaSourceStats?.width,
    sourceFrameHeight: mediaSourceStats?.height,
    sourceFrames: mediaSourceStats?.frames,
    sourceFramesDropped: mediaSourceStats?.framesDropped,
    sourceFramesPerSecond: mediaSourceStats
      ? resolveSourceFramesPerSecond(mediaSourceStats, prevTrackStats)
      : undefined,
    sourceTimestamp: mediaSourceStats?.timestamp,
    sourceStatsAvailable: Boolean(mediaSourceStats),
  };
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
