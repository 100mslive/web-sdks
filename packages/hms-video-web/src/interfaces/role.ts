import { SimulcastLayers } from './simulcast-layers';

export interface HMSRole {
  name: string;
  publishParams: PublishParams;
  subscribeParams: {
    subscribeToRoles: string[];
    maxSubsBitRate: number;
  };
  permissions: {
    endRoom: boolean;
    removeOthers: boolean;
    unmute: boolean;
    mute: boolean;
    changeRole: boolean;
    hlsStreaming: boolean;
    rtmpStreaming: boolean;
    browserRecording: boolean;
  };
  priority: number;
}

export interface PublishParams {
  audio: {
    bitRate: number;
    codec: string;
  };
  video: {
    bitRate: number;
    codec: string;
    frameRate: number;
    width: number;
    height: number;
  };
  screen: {
    bitRate: number;
    codec: string;
    frameRate: number;
    width: number;
    height: number;
  };
  allowed: string[];
  simulcast?: {
    video: SimulcastLayers;
    screen: SimulcastLayers;
  };
}
