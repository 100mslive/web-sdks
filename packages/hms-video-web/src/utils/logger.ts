export enum HMSLogLevel {
  VERBOSE,
  DEBUG,
  INFO,
  WARN,
  ERROR,
  NONE,
}

export default class HMSLogger {
  static level: HMSLogLevel = HMSLogLevel.VERBOSE

  static v(tag: string, message: string, ...optionalParams: any[]) {
    this.log(HMSLogLevel.VERBOSE, tag, message, optionalParams);
  }

  static d(tag: string, message: string, ...optionalParams: any[]) {
    this.log(HMSLogLevel.DEBUG, tag, message, optionalParams);
  }

  static i(tag: string, message: string, ...optionalParams: any[]) {
    this.log(HMSLogLevel.INFO, tag, message, optionalParams);
  }

  static w(tag: string, message: string, ...optionalParams: any[]) {
    this.log(HMSLogLevel.WARN, tag, message, optionalParams);
  }

  static e(tag: string, message: string, ...optionalParams: any[]) {
    this.log(HMSLogLevel.ERROR, tag, message, optionalParams);
  }

  private static log(level: HMSLogLevel, tag: string, message: string, ...optionalParams: any[]) {
    if (this.level.valueOf() > level.valueOf()) {
      return;
    }

    switch (level) {
      case HMSLogLevel.VERBOSE: {
        console.log(`${tag}: ${message}`, ...optionalParams);
        break;
      }
      case HMSLogLevel.DEBUG: {
        console.debug(`${tag}: ${message}`, ...optionalParams);
        break;
      }
      case HMSLogLevel.INFO: {
        console.info(`${tag}: ${message}`, ...optionalParams);
        break;
      }
      case HMSLogLevel.WARN: {
        console.warn(`${tag}: ${message}`, ...optionalParams);
        break;
      }
      case HMSLogLevel.ERROR: {
        console.error(`${tag}: ${message}`, ...optionalParams);
        break;
      }
    }
  }
};
