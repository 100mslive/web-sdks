type WithBitrate = { bitrate: number };

export type HMSTrackStats = RTCRtpStreamStats & { peerID?: string; peerName?: string };
export type HMSInboundTrackStats = RTCInboundRtpStreamStats;
export type HMSOutboundTrackStats = RTCOutboundRtpStreamStats;

export type HMSPeerStats = {
  publish?: RTCIceCandidatePairStats & WithBitrate;
  subscribe?: RTCIceCandidatePairStats & WithBitrate;
};
