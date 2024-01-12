import { HMSTrackSource } from '../../media/tracks';

/**
 * interface for track server sends/receives
 */
export interface Track {
  mute: boolean;
  type: 'audio' | 'video';
  source: HMSTrackSource;
  description: string;
  track_id: string;
  stream_id: string;
}
