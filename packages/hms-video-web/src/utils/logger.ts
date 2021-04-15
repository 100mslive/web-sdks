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

    let method;
    switch (level) {
      case HMSLogLevel.VERBOSE: {
        method = console.log;
        break;
      }
      case HMSLogLevel.DEBUG: {
        method = console.debug;
        break;
      }
      case HMSLogLevel.INFO: {
        method = console.info;
        break;
      }
      case HMSLogLevel.WARN: {
        method = console.warn;
        break;
      }
      case HMSLogLevel.ERROR: {
        method = console.error;
        break;
      }
    }
    if (optionalParams.length > 0) {
      method && method(`${tag}: ${message}`, ...optionalParams);
    } else {
      method && method(`${tag}: ${message}`, ...optionalParams);
    }
  }
};
