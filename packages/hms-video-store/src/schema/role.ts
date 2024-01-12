import type { HMSRole } from '../interfaces';

export type HMSRoleName = string;

export interface HMSPublishAllowed {
  video: boolean;
  audio: boolean;
  screen: boolean;
}

export type { HMSRole };
