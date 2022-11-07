import { DeviceMap } from './HMSDeviceManager';
import { HMSException } from '../error/HMSException';

export interface HMSDeviceChangeEvent {
  error?: HMSException;
  devices: DeviceMap;
  selection?: MediaDeviceInfo;
  type: 'audioOutput' | 'audioInput' | 'video';
}
