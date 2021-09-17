import { HMSTrackSource } from '../../media/tracks';

export interface Track {
  mute: boolean;
  type: 'audio' | 'video';
  source: HMSTrackSource;
  description: string;
  track_id: string;
  stream_id: string;
}
