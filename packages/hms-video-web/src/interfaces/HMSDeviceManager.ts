export interface HMSDeviceManager {
  audioInput: InputDeviceInfo[];
  audioOutput: MediaDeviceInfo[];
  videoInput: InputDeviceInfo[];
  outputDevice?: MediaDeviceInfo;
}

export type DeviceMap = Omit<HMSDeviceManager, 'outputDevice'>;
