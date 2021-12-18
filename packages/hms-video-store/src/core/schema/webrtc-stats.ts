import { HMSPeerConnectionStats as SDKHMSPeerConnectionStats } from '@100mslive/hms-video';

type WithBitrate = { bitrate: number };

export type HMSPeerConnectionStats = Pick<SDKHMSPeerConnectionStats, 'type' | 'packetsLost' | 'jitter'>;

export type HMSTrackStats = RTCRtpStreamStats & { peerID?: string; peerName?: string } & WithBitrate;
export type HMSInboundTrackStats = HMSTrackStats & RTCInboundRtpStreamStats;
export type HMSOutboundTrackStats = HMSTrackStats & RTCOutboundRtpStreamStats;

export type RTCTrackStats = RTCInboundRtpStreamStats | RTCOutboundRtpStreamStats;

export type HMSPeerStats = {
  publish?: RTCIceCandidatePairStats & WithBitrate;
  subscribe?: RTCIceCandidatePairStats & WithBitrate;
};
