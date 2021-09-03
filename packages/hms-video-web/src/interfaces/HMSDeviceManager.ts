export interface HMSDeviceManager {
  audioInput: MediaDeviceInfo[];
  audioOutput: MediaDeviceInfo[];
  videoInput: MediaDeviceInfo[];
  outputDevice?: MediaDeviceInfo;
}

export type DeviceMap = Omit<HMSDeviceManager, 'outputDevice'>;
