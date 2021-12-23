import { HMSPeerConnectionStats as SDKHMSPeerConnectionStats } from '@100mslive/hms-video';

type WithBitrate = { bitrate: number };

/**
 * Missing properties in TS eventhough WebRTC supports it.
 * Ref: https://www.w3.org/TR/webrtc-stats/#summary
 */
type MissingRTCTrackStats = {
  bytesReceived?: number;
  framesPerSecond?: number;
  bytesSent?: number;
  jitter?: number;
  packetsLost?: number;
  qualityLimitationReason?: string;
};

export type HMSPeerConnectionStats = Pick<SDKHMSPeerConnectionStats, 'type' | 'packetsLost' | 'jitter'>;

export type HMSTrackStats = RTCRtpStreamStats & { peerID?: string; peerName?: string } & WithBitrate &
  MissingRTCTrackStats;
export type HMSInboundTrackStats = HMSTrackStats & RTCInboundRtpStreamStats;
export type HMSOutboundTrackStats = HMSTrackStats & RTCOutboundRtpStreamStats;

export type RTCTrackStats = RTCInboundRtpStreamStats | RTCOutboundRtpStreamStats;

export type HMSPeerStats = {
  publish?: RTCIceCandidatePairStats & WithBitrate;
  subscribe?: RTCIceCandidatePairStats & WithBitrate;
};
