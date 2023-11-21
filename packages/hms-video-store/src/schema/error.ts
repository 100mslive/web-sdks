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
