import { HMSAudioMode } from '../interfaces';

export interface HMSMediaSettings {
  audioInputDeviceId: string;
  videoInputDeviceId: string;
  audioOutputDeviceId?: string;
  audioMode?: HMSAudioMode;
}
