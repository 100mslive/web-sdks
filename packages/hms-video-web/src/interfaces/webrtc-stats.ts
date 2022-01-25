/**
 * Missing properties in TS eventhough WebRTC supports it.
 * Ref: https://www.w3.org/TR/webrtc-stats/#summary
 */
interface MissingCommonStats {
  frameHeight?: number;
  frameWidth?: number;
  framesPerSecond?: number;
}

interface MissingOutboundStats extends RTCOutboundRtpStreamStats, MissingCommonStats {
  bytesSent?: number;
  packetsSent?: number;
  qualityLimitationReason?: string;
  roundTripTime?: number;
  totalRoundTripTime?: number;
}

interface MissingInboundStats extends RTCInboundRtpStreamStats, MissingCommonStats {
  bytesReceived?: number;
  framesDropped?: number;
  jitter?: number;
  packetsLost?: number;
  packetsLostRate?: number;
  packetsReceived?: number;
}

export type PeerConnectionType = 'publish' | 'subscribe';

interface BaseTrackStats extends RTCRtpStreamStats {
  peerID?: string;
  peerName?: string;
  bitrate: number;
}

export interface HMSTrackStats extends BaseTrackStats, MissingInboundStats, MissingOutboundStats {}

/**
 * Extends RTCOutboundRtpStreamStats
 */
export interface HMSLocalTrackStats extends BaseTrackStats, MissingOutboundStats {}

/**
 * Extends RTCInboundRtpStreamStats
 */
export interface HMSRemoteTrackStats extends BaseTrackStats, MissingInboundStats {}

export type RTCTrackStats = MissingInboundStats | MissingOutboundStats;

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
