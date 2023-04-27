export interface PublishAnalyticPayload {
  sequence_num: number; // An increasing seq number starting from 1
  max_window_sec: number; // Take this value from the INIT response
  joined_at: number; // Local peer's joinedAt time in milliseconds
  video: Array<VideoAnalytics>; // Each element represents a video track that the peer is uploading
  audio: Array<AudioAnalytics>; // Each element represents an audio track that the peer is uploading
}

export interface TrackAnalytics {
  track_id: string; // Track id of the track
  ssrc: string;
  source: string; // Source of the track - [regular, screen, playlist]
}

export interface AudioAnalytics extends TrackAnalytics {
  audio_samples: Array<BaseSample>;
}

export interface VideoAnalytics extends TrackAnalytics {
  rid?: string; // rid of the track if simulcast is present, else null
  video_samples: Array<VideoSample>;
}

// One sample would contain the data of the last 30 seconds window
export interface BaseSample {
  timestamp: number; // the ts at the end of the 30s window
  avg_round_trip_time: number;
  avg_jitter: number;
  total_packets_lost: number;
  avg_bitrate: number;
  avg_available_outgoing_bitrate: number;
}

export interface VideoSample extends BaseSample {
  total_quality_limitation: QualityLimitation;
  avg_fps: number;
  resolution: Resolution;
}

export interface QualityLimitation {
  bandwith: number; // Total time in millis in the last 30s where this video track was limited by bandwidth
  cpu: number; // Total time in millis in the last 30s where this video track was limited by CPU
  none: number; // Total time in millis in the last 30s where this video track was not limited
}

export interface Resolution {
  width: number; // the frame width in the last
  height: number;
}
