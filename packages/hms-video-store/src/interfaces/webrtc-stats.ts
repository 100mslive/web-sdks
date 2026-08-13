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

/**
 * `RTCIceCandidateStats` is absent from TS's DOM lib, and `relayProtocol`/`networkType`/`url`
 * are reported by browsers but not typed anywhere.
 * Ref: https://www.w3.org/TR/webrtc-stats/#icecandidate-dict*
 */
export interface HMSIceCandidateStats extends RTCStats {
  transportId?: string;
  address?: string;
  port?: number;
  protocol?: IceProtocol;
  candidateType?: RTCIceCandidateType;
  priority?: number;
  url?: string;
  /**
   * Transport used to reach the TURN server. Only set on candidates obtained through a relay,
   * which makes it — not `candidateType` — the proof that a path is relayed: a candidate can
   * carry `relayProtocol` while its `candidateType` is `prflx`, when the peer-reflexive address
   * was learnt over the relay.
   */
  relayProtocol?: IceProtocol | 'tls';
  networkType?: string;
}

type IceProtocol = 'udp' | 'tcp';

/**
 * How the local peer is actually reaching the SFU: a direct path (`host`/`srflx`/`prflx`) or
 * a TURN relay, with the transport used to reach the TURN server.
 */
export type HMSConnectionType = RTCIceCandidateType | `relay(${IceProtocol | 'tls'})`;

/**
 * The active ICE candidate pair of a peer connection, along with the two candidates it points
 * at — resolved from `localCandidateId`/`remoteCandidateId` against the same stats report, since
 * those ids are only meaningful within the report they came from.
 */
export type HMSConnectionStats = RTCIceCandidatePairStats & {
  bitrate: number;
  localCandidate?: HMSIceCandidateStats;
  remoteCandidate?: HMSIceCandidateStats;
};

export interface HMSPeerStats {
  publish?: HMSConnectionStats & {
    /**
     * Sum of `bytesSent` across active outbound-rtp streams at the time the stat was taken.
     * Used internally to derive `bitrate` on the next sample so the value only reflects
     * actual media traffic, not ICE/RTCP/BWE probe padding (LIV-243).
     */
    outboundRtpBytesSent?: number;
  };
  subscribe?: HMSConnectionStats & {
    packetsLost: number;
    packetsLostRate: number;
    jitter: number;
  };
}
