import { HMSSimulcastLayer } from '../../interfaces';

export interface BroadcastResponse {
  timestamp: number;
}

export interface PreferVideoLayerParams {
  params: {
    max_spatial_layer: HMSSimulcastLayer;
    track_id: string;
  };
  method: 'prefer-video-track-state';
  id: string;
  jsonrpc: '2.0';
}

export interface PreferVideoLayerResponse {
  result: VideoTrackLayerUpdate;
  error?: {
    code: number;
    message: string;
  };
  method: 'prefer-video-track-state';
  id: string;
  jsonrpc: '2.0';
}

export interface PreferAudioLayerParams {
  params: {
    subscribed: boolean;
    track_id: string;
  };
  id: string;
  method: 'prefer-audio-track-state';
  jsonrpc: '2.0';
}

export interface PreferAudioLayerResponse {
  id: string;
  error?: {
    code: number;
    message: string;
  };
  jsonrpc: '2.0';
}

export interface VideoTrackLayerUpdate {
  current_layer: HMSSimulcastLayer;
  expected_layer: HMSSimulcastLayer;
  track_id: string;
  subscriber_degraded: boolean;
  publisher_degraded: boolean;
}
