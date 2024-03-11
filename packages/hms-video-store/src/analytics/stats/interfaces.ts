interface BaseStatsPayload {
  sequence_num: number; // An increasing seq number starting from 1
  max_window_sec: number; // Take this value from the INIT response
  joined_at: number; // Local peer's joinedAt time in milliseconds
}

export interface PublishAnalyticPayload extends BaseStatsPayload {
  video: Array<LocalAudioTrackAnalytics>; // Each element represents a video track that the peer is uploading
  audio: Array<LocalAudioTrackAnalytics>; // Each element represents an audio track that the peer is uploading
}

export interface SubscribeAnalyticPayload extends BaseStatsPayload {
  video: Array<RemoteVideoTrackAnalytics>; // Each element represents a video track that the peer is uploading
  audio: Array<RemoteAudioTrackAnalytics>; // Each element represents an audio track that the peer is uploading
}

interface TrackAnalytics<Sample> {
  track_id: string; // Track id of the track
  rid?: string; // rid of the track if simulcast is present, else null
  ssrc: string;
  source: string; // Source of the track - [regular, screen, playlist]
  samples: Array<Sample>;
}

export type LocalAudioTrackAnalytics = TrackAnalytics<LocalBaseSample>;

export type LocalVideoTrackAnalytics = TrackAnalytics<LocalVideoSample>;

export type RemoteAudioTrackAnalytics = TrackAnalytics<RemoteAudioSample>;

export type RemoteVideoTrackAnalytics = TrackAnalytics<RemoteVideoSample>;

// One sample would contain the data of the last 30 seconds window
export interface LocalBaseSample {
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

export interface LocalVideoSample extends LocalBaseSample {
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

interface RemoteBaseSample {
  timestamp: number;
  estimated_playout_timestamp?: number;
  avg_jitter_buffer_delay?: number;
}

export interface RemoteAudioSample extends RemoteBaseSample {
  audio_level?: number;
  audio_concealed_samples?: number;
  audio_total_samples_received?: number;
  audio_concealment_events?: number;
  fec_packets_discarded?: number;
  fec_packets_received?: number;
  total_samples_duration?: number;
  total_packets_received?: number;
  total_packets_lost?: number;
  jitter_buffer_delay_high_seconds?: number;
}

export interface RemoteVideoSample extends RemoteBaseSample {
  avg_frames_received_per_sec?: number;
  avg_frames_dropped_per_sec?: number;
  avg_frames_decoded_per_sec?: number;
  total_pli_count?: number;
  total_nack_count?: number;
  avg_av_sync_ms?: number;
  frame_width?: number;
  frame_height?: number;
  pause_count?: number;
  pause_duration_seconds?: number;
  freeze_count?: number;
  freeze_duration_seconds?: number;
}
