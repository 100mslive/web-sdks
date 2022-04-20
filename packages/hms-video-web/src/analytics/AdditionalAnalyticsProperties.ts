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
  peer_id?: string;
  token?: string;
}
