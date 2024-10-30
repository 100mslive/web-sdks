import { HMSTrackType } from '../media/tracks/HMSTrackType';

/**
 * any mid call error notification will be in this format
 */
export interface HMSException {
  code: number;
  action: string;
  name: string;
  message: string;
  description: string;
  isTerminal: boolean;
  timestamp: Date;
  nativeError?: Error;
}

export interface HMSTrackException {
  code: number;
  action: string;
  name: string;
  message: string;
  description: string;
  isTerminal: boolean;
  timestamp: Date;
  nativeError?: Error;
  trackType: HMSTrackType;
}
