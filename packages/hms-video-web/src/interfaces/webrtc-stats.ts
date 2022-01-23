type WithBitrate = { bitrate: number };

/**
 * Missing properties in TS eventhough WebRTC supports it.
 * Ref: https://www.w3.org/TR/webrtc-stats/#summary
 */
interface MissingOutboundStats extends RTCOutboundRtpStreamStats {
  bytesSent?: number;
  packetsSent?: number;
  qualityLimitationReason?: string;
  roundTripTime?: number;
  totalRoundTripTime?: number;
}

interface MissingInboundStats extends RTCInboundRtpStreamStats {
  bytesReceived?: number;
  frameHeight?: number;
  frameWidth?: number;
  framesDropped?: number;
  framesPerSecond?: number;
  jitter?: number;
  packetsLost?: number;
  packetsLostRate?: number;
  packetsReceived?: number;
}

export type PeerConnectionType = 'publish' | 'subscribe';

type BaseTrackStats = RTCRtpStreamStats & { peerID?: string; peerName?: string } & WithBitrate;
export type HMSTrackStats = BaseTrackStats & MissingInboundStats & MissingOutboundStats;
export type HMSLocalTrackStats = BaseTrackStats & MissingInboundStats;
export type HMSRemoteTrackStats = BaseTrackStats & MissingOutboundStats;

export type RTCTrackStats = MissingInboundStats | MissingOutboundStats;

type AdditionalPeerStats = {
  packetsLost: number;
  packetsLostRate: number;
  jitter: number;
};

export interface HMSPeerStats {
  publish?: RTCIceCandidatePairStats & WithBitrate;
  subscribe?: RTCIceCandidatePairStats & WithBitrate & AdditionalPeerStats;
}
