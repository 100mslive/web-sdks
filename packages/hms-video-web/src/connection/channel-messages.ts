import { HMSSimulcastLayer } from '../interfaces';

export interface PreferVideoLayerParams {
  params: {
    max_spatial_layer: HMSSimulcastLayer;
    track_id: string;
  };
  method: 'prefer-video-track-state';
}

export interface PreferLayerResponse {
  id: string;
  error?: {
    code: number;
    message: string;
  };
}

export interface PreferAudioLayerParams {
  params: {
    subscribed: boolean;
    track_id: string;
  };
  method: 'prefer-audio-track-state';
}

export interface VideoTrackLayerUpdate {
  current_layer: HMSSimulcastLayer;
  expected_layer: Exclude<HMSSimulcastLayer, HMSSimulcastLayer.NONE>;
  track_id: string;
  subscriber_degraded: boolean;
  publisher_degraded: boolean;
}
