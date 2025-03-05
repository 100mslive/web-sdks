import { HMSException } from '../error/HMSException';

export interface HMSDeviceChangeEvent {
  isUserSelection?: boolean;
  error?: HMSException;
  devices?: DeviceMap;
  selection?: Partial<MediaDeviceInfo>;
  internal?: boolean;
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

export type SelectedDevices = {
  [DeviceType.audioInput]?: MediaDeviceInfo;
  [DeviceType.videoInput]?: MediaDeviceInfo;
  [DeviceType.audioOutput]?: MediaDeviceInfo;
};
