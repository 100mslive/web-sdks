export interface Track {
  mute: boolean;
  type: 'audio' | 'video';
  source: 'regular' | 'screen' | 'plugin';
  description: string;
  track_id: string;
  stream_id: string;
}
