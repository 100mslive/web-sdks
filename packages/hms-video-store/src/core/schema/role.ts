import type { HMSRole } from '@100mslive/hms-video';

export type HMSRoleName = string;

export interface HMSPublishAllowed {
  video: boolean;
  audio: boolean;
  screen: boolean;
}

export type { HMSRole };
