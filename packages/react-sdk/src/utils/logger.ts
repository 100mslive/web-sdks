export enum HMSLogLevel {
  VERBOSE,
  DEBUG,
  INFO,
  WARN,
  ERROR,
  NONE,
}

export default class HMSLogger {
  static level: HMSLogLevel = HMSLogLevel.VERBOSE;

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

  // eslint-disable-next-line complexity
  private static log(level: HMSLogLevel, tag: string, ...data: any[]) {
    if (this.level.valueOf() > level.valueOf()) {
      return;
    }

    switch (level) {
      case HMSLogLevel.VERBOSE: {
        console.log('HMSui-components: ', tag, ...data);
        break;
      }
      case HMSLogLevel.DEBUG: {
        console.debug('HMSui-components: ', tag, ...data);
        break;
      }
      case HMSLogLevel.INFO: {
        console.info('HMSui-components: ', tag, ...data);
        break;
      }
      case HMSLogLevel.WARN: {
        console.warn('HMSui-components: ', tag, ...data);
        break;
      }
      case HMSLogLevel.ERROR: {
        console.error('HMSui-components: ', tag, ...data);
        break;
      }
    }
  }
}
