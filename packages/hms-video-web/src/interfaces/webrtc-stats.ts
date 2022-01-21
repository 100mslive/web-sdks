type WithBitrate = { bitrate: number };

/**
 * Missing properties in TS eventhough WebRTC supports it.
 * Ref: https://www.w3.org/TR/webrtc-stats/#summary
 */
type MissingRTCTrackStats = {
  bytesReceived?: number;
  frameHeight?: number;
  frameWidth?: number;
  framesDropped?: number;
  framesPerSecond?: number;
  bytesSent?: number;
  jitter?: number;
  packetsLost?: number;
  packetsLostRate?: number;
  qualityLimitationReason?: string;
};

export type PeerConnectionType = 'publish' | 'subscribe';

export type HMSTrackStats = RTCRtpStreamStats & { peerID?: string; peerName?: string } & WithBitrate &
  MissingRTCTrackStats;
export type HMSInboundTrackStats = HMSTrackStats & RTCInboundRtpStreamStats;
export type HMSOutboundTrackStats = HMSTrackStats & RTCOutboundRtpStreamStats;

export type RTCTrackStats = RTCInboundRtpStreamStats | RTCOutboundRtpStreamStats;

type AdditionalPeerStats = {
  packetsLost: number;
  packetsLostRate: number;
  jitter: number;
};

export interface HMSPeerStats {
  publish?: RTCIceCandidatePairStats & WithBitrate;
  subscribe?: RTCIceCandidatePairStats & WithBitrate & AdditionalPeerStats;
}
