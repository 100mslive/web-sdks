type WithBitrate = { bitrate: number };

export type HMSTrackStats = RTCRtpStreamStats & { peerID?: string; peerName?: string } & WithBitrate;
export type HMSInboundTrackStats = HMSTrackStats & RTCInboundRtpStreamStats;
export type HMSOutboundTrackStats = HMSTrackStats & RTCOutboundRtpStreamStats;

export type RTCTrackStats = RTCInboundRtpStreamStats | RTCOutboundRtpStreamStats;

export type HMSPeerStats = {
  publish?: RTCIceCandidatePairStats & WithBitrate;
  subscribe?: RTCIceCandidatePairStats & WithBitrate;
};
