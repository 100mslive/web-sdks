import { HMSLogLevel } from '../internal';

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

  static time(mark: string) {
    this.log(HMSLogLevel.TIME, '[HMSPerformanceTiming]', mark);
  }

  static timeEnd(mark: string) {
    this.log(HMSLogLevel.TIMEEND, '[HMSPerformanceTiming]', mark, mark);
  }

  static cleanup() {
    performance.clearMarks();
    performance.clearMeasures();
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
      case HMSLogLevel.TIME: {
        performance.mark(data[1]);
        break;
      }
      case HMSLogLevel.TIMEEND: {
        const tag = data[0];
        const mark = data[1];
        try {
          const entry = performance.measure(mark, mark);
          //@ts-ignore
          this.log(HMSLogLevel.DEBUG, tag, mark, entry?.duration);
          performance.clearMarks(mark);
          performance.clearMeasures(mark);
        } catch (error) {
          this.log(HMSLogLevel.DEBUG, tag, mark, error);
        }
        break;
      }
    }
  }
}
