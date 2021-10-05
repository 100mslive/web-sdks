export interface HMSDeviceManager {
  audioInput: MediaDeviceInfo[];
  audioOutput: MediaDeviceInfo[];
  videoInput: MediaDeviceInfo[];
  outputDevice?: MediaDeviceInfo;
  hasWebcamPermission: boolean;
  hasMicrophonePermission: boolean;
}

export type DeviceMap = Omit<HMSDeviceManager, 'outputDevice' | 'hasWebcamPermission' | 'hasMicrophonePermission'>;
