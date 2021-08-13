import { HMSLogLevel } from '../core/hmsSDKStore/sdkTypes';

const HMS_STORE_TAG = 'HMS-Store:';

export class HMSLogger {
  static level: HMSLogLevel = HMSLogLevel.VERBOSE;

  static v(tag: string, ...data: any[]) {
    this.log(HMSLogLevel.VERBOSE, tag, ...data);
  }

  static d(...data: any[]) {
    this.log(HMSLogLevel.DEBUG, ...data);
  }

  static i(...data: any[]) {
    this.log(HMSLogLevel.INFO, ...data);
  }

  static w(...data: any[]) {
    this.log(HMSLogLevel.WARN, ...data);
  }

  static e(...data: any[]) {
    this.log(HMSLogLevel.ERROR, ...data);
  }

  /* eslint-disable */
  private static log(level: HMSLogLevel, ...data: any[]) {
    if (this.level.valueOf() > level.valueOf()) {
      return;
    }

    switch (level) {
      case HMSLogLevel.VERBOSE: {
        console.log(HMS_STORE_TAG, ...data);
        break;
      }
      case HMSLogLevel.DEBUG: {
        console.debug(HMS_STORE_TAG, ...data);
        break;
      }
      case HMSLogLevel.INFO: {
        console.info(HMS_STORE_TAG, ...data);
        break;
      }
      case HMSLogLevel.WARN: {
        console.warn(HMS_STORE_TAG, ...data);
        break;
      }
      case HMSLogLevel.ERROR: {
        console.error(HMS_STORE_TAG, ...data);
        break;
      }
    }
  }
}
