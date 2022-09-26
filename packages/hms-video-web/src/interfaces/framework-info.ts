/**
 * Used in the user agent sent to INIT, BIZ and in offline cached events.
 */
export interface HMSFrameworkInfo {
  type: 'js' | 'react-web';
  /**
   * version of the framework being used, i.e., version of react
   * optional since there's no framework version required for JS SDK usage
   */
  version?: string;
  /**
   * version of the SDK being used i.e., version of hms-video-store or react-sdk
   */
  sdkVersion: string;
}
