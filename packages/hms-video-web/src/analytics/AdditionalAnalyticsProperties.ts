export interface AdditionalAnalyticsProperties {
  bitrate?: {
    publish?: number;
    subscribe?: number;
  };
  network_info?: Partial<NetworkInformation>;
  document_hidden?: boolean;
  num_degraded_tracks?: number;
  max_sub_bitrate?: number;
}
