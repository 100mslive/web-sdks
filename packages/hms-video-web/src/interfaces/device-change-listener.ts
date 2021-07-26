import { HMSDeviceManager } from './HMSDeviceManager';

export interface DeviceChangeListener {
  onDeviceChange(deviceMap: HMSDeviceManager): void;
}
