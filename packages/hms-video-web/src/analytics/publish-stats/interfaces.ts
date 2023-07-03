export interface PublishAnalyticPayload {
  sequence_num: number; // An increasing seq number starting from 1
  max_window_sec: number; // Take this value from the INIT response
  joined_at: number; // Local peer's joinedAt time in milliseconds
  video: Array<TrackAnalytics>; // Each element represents a video track that the peer is uploading
  audio: Array<TrackAnalytics>; // Each element represents an audio track that the peer is uploading
}

export interface TrackAnalytics {
  track_id: string; // Track id of the track
  rid?: string; // rid of the track if simulcast is present, else null
  ssrc: string;
  source: string; // Source of the track - [regular, screen, playlist]
  samples: Array<BaseSample | VideoSample>;
}

// One sample would contain the data of the last 30 seconds window
export interface BaseSample {
  timestamp: number; // the ts at the end of the 30s window
  avg_round_trip_time_ms?: number;
  avg_jitter_ms?: number;
  total_packets_lost?: number;
  avg_bitrate_bps?: number;
  avg_available_outgoing_bitrate_bps?: number;
  total_packets_sent?: number;
  total_packet_sent_delay_sec?: number;
  total_nack_count?: number;
  total_fir_count?: number;
  total_pli_count?: number;
}

export interface VideoSample extends BaseSample {
  total_quality_limitation?: QualityLimitation;
  avg_fps?: number;
  resolution?: Resolution;
}

export interface QualityLimitation {
  bandwith_sec?: number; // Total time in millis in the last 30s where this video track was limited by bandwidth
  cpu_sec?: number; // Total time in millis in the last 30s where this video track was limited by CPU
  other_sec?: number;
}

export interface Resolution {
  width_px?: number; // the frame width in the last
  height_px?: number;
}
