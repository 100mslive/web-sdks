export enum HMSLogLevel {
  VERBOSE,
  DEBUG,
  INFO,
  WARN,
  TIME,
  TIMEEND,
  ERROR,
  NONE,
}

// @ts-ignore - window.expect is available only when in test environment
const isTestEnv = typeof window !== 'undefined' && typeof window.expect !== 'undefined';
/**
 * TODO: fix this so logs show the real file and line numbers where they originated from instead of this class
 * https://stackoverflow.com/questions/13815640/a-proper-wrapper-for-console-log-with-correct-line-number
 */
export default class HMSLogger {
  static level: HMSLogLevel = isTestEnv ? HMSLogLevel.NONE : HMSLogLevel.VERBOSE;

  static v(tag: string, ...data: any[]) {
    this.log(HMSLogLevel.VERBOSE, tag, ...data);
  }

  static d(tag: string, ...data: any[]) {
    this.log(HMSLogLevel.DEBUG, tag, ...data);
  }

  static i(tag: string, ...data: any[]) {
    this.log(HMSLogLevel.INFO, tag, ...data);
  }

  static w(tag: string, ...data: any[]) {
    this.log(HMSLogLevel.WARN, tag, ...data);
  }

  static e(tag: string, ...data: any[]) {
    this.log(HMSLogLevel.ERROR, tag, ...data);
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

  // eslint-disable-next-line complexity
  private static log(level: HMSLogLevel, tag: string, ...data: any[]) {
    if (this.level.valueOf() > level.valueOf()) {
      return;
    }

    switch (level) {
      case HMSLogLevel.VERBOSE: {
        console.log(tag, ...data);
        break;
      }
      case HMSLogLevel.DEBUG: {
        console.debug(tag, ...data);
        break;
      }
      case HMSLogLevel.INFO: {
        console.info(tag, ...data);
        break;
      }
      case HMSLogLevel.WARN: {
        console.warn(tag, ...data);
        break;
      }
      case HMSLogLevel.ERROR: {
        console.error(tag, ...data);
        break;
      }
      case HMSLogLevel.TIME: {
        performance.mark(data[0]);
        break;
      }
      case HMSLogLevel.TIMEEND: {
        const mark = data[0];
        try {
          const entry = performance.measure(mark, mark);
          // @ts-ignore
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
