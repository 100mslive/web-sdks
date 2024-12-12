import { HMSAudioMode } from '../interfaces';

export interface HMSMediaSettings {
  audioInputDeviceId: string;
  videoInputDeviceId: string;
  audioOutputDeviceId?: string;
  audioMode?: HMSAudioMode;
}

export interface DebugInfo {
  websocketURL?: string;
  enabledFlags?: string[];
  initEndpoint?: string;
}
