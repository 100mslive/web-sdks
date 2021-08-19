import { HMSException } from '../error/HMSException';
import { DeviceMap } from './HMSDeviceManager';

export interface DeviceChangeEvent {
  error?: HMSException;
  devices: DeviceMap;
  selection?: InputDeviceInfo;
  type: 'audio' | 'video';
}
