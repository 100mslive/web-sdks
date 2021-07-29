import { DeviceMap } from './HMSDeviceManager';

export interface DeviceChangeListener {
  onDeviceChange(deviceMap: DeviceMap): void;
}
