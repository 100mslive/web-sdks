import { HMSHLSException } from '../error/HMSHLSException';

declare global {
  interface Window {
    __hms:
      | {
          sdk:
            | {
                sendHLSAnalytics: (error: HMSHLSException) => void;
              }
            | undefined;
        }
      | undefined;
  }
}
