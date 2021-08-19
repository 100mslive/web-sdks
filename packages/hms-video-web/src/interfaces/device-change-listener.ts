import { HMSDeviceChangeEvent } from './device-change-event';

export interface DeviceChangeListener {
  onDeviceChange?(event: HMSDeviceChangeEvent): void;
}
