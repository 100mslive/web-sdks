import { HMSAudioMode } from '../interfaces';

export interface HMSMediaSettings {
  audioInputDeviceId: string;
  videoInputDeviceId: string;
  audioOutputDeviceId?: string;
  audioMode?: HMSAudioMode;
}

export interface CallDetails {
  websocketUrl?: string;
  enabledFlags?: string[];
  initEndpoint?: string;
}
