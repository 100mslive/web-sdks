import { HMSException } from '../error/HMSException';

export interface HMSDeviceChangeEvent {
  error?: HMSException;
  devices: DeviceMap;
  selection?: MediaDeviceInfo;
  type: 'audioOutput' | 'audioInput' | 'video';
}

export enum DeviceType {
  videoInput = 'videoInput',
  audioInput = 'audioInput',
  audioOutput = 'audioOutput',
}

export interface DeviceMap {
  [DeviceType.audioInput]: MediaDeviceInfo[];
  [DeviceType.audioOutput]: MediaDeviceInfo[];
  [DeviceType.videoInput]: MediaDeviceInfo[];
}

export interface DeviceChangeListener {
  onDeviceChange?(event: HMSDeviceChangeEvent): void;
}
