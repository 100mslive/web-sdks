import { TransportState } from '../transport/models/TransportState';

// native APIs missing in TS
type ConnectionType = 'bluetooth' | 'cellular' | 'ethernet' | 'mixed' | 'none' | 'other' | 'unknown' | 'wifi' | 'wimax';

type EffectiveConnectionType = '2g' | '3g' | '4g' | 'slow-2g';

interface NetworkInformation {
  type: ConnectionType;
  effectiveType: EffectiveConnectionType;
  downlinkMax: number;
  downlink: number;
  rtt: number;
}

export interface AdditionalAnalyticsProperties {
  bitrate?: {
    publish?: number;
    subscribe?: number;
  };
  network_info?: Partial<NetworkInformation>;
  document_hidden?: boolean;
  num_degraded_tracks?: number;
  max_sub_bitrate?: number;
  recent_pong_response_times: number[];
  transport_state?: TransportState;
}
