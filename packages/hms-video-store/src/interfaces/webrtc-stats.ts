/**
 * Missing properties in TS eventhough WebRTC supports it.
 * Ref: https://www.w3.org/TR/webrtc-stats/#summary
 */

import { RID } from './simulcast-layers';

type QualityLimitationReason = RTCOutboundRtpStreamStats extends {
  qualityLimitationReason?: infer Reason;
}
  ? Reason
  : string;

type QualityLimitationDurations = RTCOutboundRtpStreamStats extends {
  qualityLimitationDurations?: infer Durations;
}
  ? Durations
  : { none: number; cpu: number; bandwidth: number; other: number };

type TrackIdentifierField = RTCInboundRtpStreamStats extends { trackIdentifier: infer Identifier }
  ? { trackIdentifier: Identifier }
  : RTCInboundRtpStreamStats extends { trackIdentifier?: infer Identifier }
  ? { trackIdentifier?: Identifier }
  : { trackIdentifier?: string };

/**
 * @internal
 * Ref: https://www.w3.org/TR/webrtc-stats/#dom-rtcremoteinboundrtpstreamstats
 */
export interface RTCRemoteInboundRtpStreamStats extends RTCReceivedRtpStreamStats {
  localId: string;
  roundTripTime?: number;
  totalRoundTripTime?: number;
  fractionLost?: number;
  reportsReceived?: number;
  roundTripTimeMeasurements?: number;
}

type MissingCommonStats = TrackIdentifierField & {
  frameHeight?: number;
  frameWidth?: number;
  framesPerSecond?: number;
  roundTripTime?: number;
  totalRoundTripTime?: number;
};

interface MissingOutboundStats extends RTCOutboundRtpStreamStats, MissingCommonStats {
  bytesSent?: number;
  packetsSent?: number;
  qualityLimitationReason?: QualityLimitationReason;
  qualityLimitationDurations?: QualityLimitationDurations;
  totalPacketSendDelay?: number;
  rid?: RID;
}

export interface MissingInboundStats extends RTCInboundRtpStreamStats, MissingCommonStats {
  bytesReceived?: number;
  framesReceived?: number;
  framesDropped?: number;
  jitter?: number;
  packetsLost?: number;
  packetsLostRate?: number;
  packetsReceived?: number;
  concealedSamples?: number;
  silentConcealedSamples?: number;
  audioLevel?: number;
  totalSamplesReceived?: number;
  concealmentEvents?: number;
  fecPacketsDiscarded?: number;
  fecPacketsReceived?: number;
  totalSamplesDuration?: number;
  pauseCount?: number;
  totalPausesDuration?: number;
  freezeCount?: number;
  totalFreezesDuration?: number;
  jitterBufferDelay?: number;
  jitterBufferEmittedCount?: number;
  estimatedPlayoutTimestamp?: DOMHighResTimeStamp;
}

export type PeerConnectionType = 'publish' | 'subscribe';

interface BaseTrackStats extends RTCRtpStreamStats {
  peerID?: string;
  peerName?: string;
  bitrate: number;
  codec?: string;
  enabled?: boolean;
}

/**
 * Extends RTCOutboundRtpStreamStats
 * Ref: https://www.w3.org/TR/webrtc-stats/#dom-rtcoutboundrtpstreamstats
 */
export interface HMSLocalTrackStats extends BaseTrackStats, MissingOutboundStats {
  /**
   * Stats perceived by the server(SFU) while receiving the local track sent by the peer
   * Ref:
   * https://www.w3.org/TR/webrtc-stats/#dom-rtcstatstype-remote-inbound-rtp
   * https://www.w3.org/TR/webrtc-stats/#dom-rtcremoteinboundrtpstreamstats
   */
  remote?: RTCRemoteInboundRtpStreamStats & { packetsLostRate?: number };
  /**
   * Capture/source stats from `media-source` (camera or screen).
   */
  sourceFrameWidth?: number;
  sourceFrameHeight?: number;
  sourceFramesPerSecond?: number;
  sourceFrames?: number;
  sourceFramesDropped?: number;
  sourceTimestamp?: DOMHighResTimeStamp;
  sourceStatsAvailable?: boolean;
}

/**
 * Extends RTCInboundRtpStreamStats
 * Ref: https://www.w3.org/TR/webrtc-stats/#dom-rtcinboundrtpstreamstats
 */
export interface HMSRemoteTrackStats extends BaseTrackStats, MissingInboundStats {}

export interface HMSTrackStats extends HMSLocalTrackStats, HMSRemoteTrackStats {}

export interface HMSPeerStats {
  publish?: RTCIceCandidatePairStats & {
    bitrate: number;
  };
  subscribe?: RTCIceCandidatePairStats & {
    bitrate: number;
    packetsLost: number;
    packetsLostRate: number;
    jitter: number;
  };
}
