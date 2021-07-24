import { SimulcastLayers } from './simulcast-layers';
import { SubscribeDegradationParams } from './subscribe-degradation-params';

export interface HMSRole {
  name: string;
  publishParams: PublishParams;
  subscribeParams: {
    subscribeToRoles: string[];
    maxSubsBitRate: number;
    subscribeDegradation?: SubscribeDegradationParams;
  };
  permissions: {
    endRoom: boolean;
    removeOthers: boolean;
    stopPresentation: boolean;
    muteAll: boolean;
    askToUnmute: boolean;
    muteSelective: boolean;
    changeRole: boolean;
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
  videoSimulcastLayers: SimulcastLayers;
  screenSimulcastLayers: SimulcastLayers;
}
