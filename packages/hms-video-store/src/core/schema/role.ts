import type { HMSRole } from '../../coreSDK';

export type HMSRoleName = string;

export interface HMSPublishAllowed {
  video: boolean;
  audio: boolean;
  screen: boolean;
}

export type { HMSRole };
