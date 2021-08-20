import { HMSException } from '../error/HMSException';
import { DeviceMap } from './HMSDeviceManager';

export interface HMSDeviceChangeEvent {
  error?: HMSException;
  devices: DeviceMap;
  selection?: InputDeviceInfo | MediaDeviceInfo;
  type: 'audioOutput' | 'audioInput' | 'video';
}
