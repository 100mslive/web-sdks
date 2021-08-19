import { DeviceMap } from '../hmsSDKStore/sdkTypes';
import { HMSException } from './error';

export interface HMSDeviceChangeEvent {
  error?: HMSException;
  devices: DeviceMap;
  selection?: InputDeviceInfo | MediaDeviceInfo;
  type: 'audioOutput' | 'audioInput' | 'video';
}
