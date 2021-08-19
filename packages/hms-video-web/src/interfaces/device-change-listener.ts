import { DeviceChangeEvent } from './device-change-event';

export interface DeviceChangeListener {
  onDeviceChange?(event: DeviceChangeEvent): void;
}
