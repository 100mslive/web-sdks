/**
 * Missing properties in TS eventhough WebRTC supports it.
 * Ref: https://www.w3.org/TR/webrtc-stats/#summary
 */

import { RID } from './simulcast-layers';

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

interface MissingCommonStats {
  frameHeight?: number;
  frameWidth?: number;
  framesPerSecond?: number;
  roundTripTime?: number;
  totalRoundTripTime?: number;
}

interface MissingOutboundStats extends RTCOutboundRtpStreamStats, MissingCommonStats {
  bytesSent?: number;
  packetsSent?: number;
  qualityLimitationReason?: string;
  rid?: RID;
}

export interface MissingInboundStats extends RTCInboundRtpStreamStats, MissingCommonStats {
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
  codec?: string;
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
