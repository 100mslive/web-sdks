import { HMSException } from './error';
import { DeviceMap } from '../hmsSDKStore/sdkTypes';

export type { DeviceMap };

/**
 * Test fails when adding InputDeviceInfo[error TS2304: Cannot find name 'InputDeviceInfo'.]
 * InputDeviceInfo extends MediaDeviceInfo. See https://w3c.github.io/mediacapture-main/#input-specific-device-info
 * So, `selection?: MediaDeviceInfo` instead of `selection?: InputDeviceInfo | MediaDeviceInfo` is valid
 */
export interface HMSDeviceChangeEvent {
  error?: HMSException;
  devices: DeviceMap;
  selection?: MediaDeviceInfo;
  type: 'audioOutput' | 'audioInput' | 'video';
}
