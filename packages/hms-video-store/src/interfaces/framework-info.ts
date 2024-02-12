/**
 * Used in the user agent sent to INIT, BIZ and in offline cached events.
 */
export interface HMSFrameworkInfo {
  type: 'js' | 'react-web';
  /**
   * version of the framework being used, that is, version of react
   * optional since there's no framework version required for JS SDK usage
   */
  version?: string;
  /**
   * version of the SDK being used, that is, version of hms-video-store or react-sdk
   */
  sdkVersion: string;
  /**
   * true when any Prebuilt Kit on any framework is used
   */
  isPrebuilt?: boolean;
}
