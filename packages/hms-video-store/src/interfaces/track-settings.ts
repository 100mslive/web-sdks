export enum HMSVideoCodec {
  VP8 = 'vp8',
  VP9 = 'vp9',
  H264 = 'h264',
}

export enum HMSAudioCodec {
  OPUS = 'opus',
}

/**
 * Refer https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/facingMode
 * for more details.
 */
export enum HMSFacingMode {
  USER = 'user',
  ENVIRONMENT = 'environment',
  LEFT = 'left',
  RIGHT = 'right',
}

export enum HMSAudioMode {
  VOICE = 'voice',
  MUSIC = 'music',
}

export interface HMSAudioTrackSettings {
  volume?: number;
  codec?: HMSAudioCodec;
  maxBitrate?: number;
  deviceId?: string;
  advanced?: Array<MediaTrackConstraintSet>;
  audioMode?: HMSAudioMode;
}

export interface HMSVideoTrackSettings {
  width?: number;
  height?: number;
  codec?: HMSVideoCodec;
  maxFramerate?: number;
  maxBitrate?: number;
  deviceId?: string;
  advanced?: Array<MediaTrackConstraintSet>;
  facingMode?: HMSFacingMode;
}

/**
 * Config to have control over screenshare being captured. Note that
 * not all fields are supported on all browsers. Even when they're supported
 * the fields acts as hints and the browser can override them.
 */
export interface HMSScreenShareConfig {
  /**
   * discard the video and only share audio track with others, useful
   * for sharing music.
   * @default false
   */
  audioOnly?: boolean;
  /**
   * do not give an option to share audio while screen sharing.
   * @default false
   */
  videoOnly?: boolean;
  /**
   * preselect the relevant tab in screenshare menu
   * browser - for preferring a browser tab
   * window - for application window
   * monitor - for full screen
   * @default monitor
   */
  displaySurface?: 'browser' | 'monitor' | 'window';
  /**
   * show the current tab first in supported browser, throws
   * error if user doesn't select current tab for sharing.
   * @default false
   */
  forceCurrentTab?: boolean;
  /**
   * show the current tab first in supported browser, but don't throw error
   * if user selects something else.
   * @default false
   */
  preferCurrentTab?: boolean;
  /**
   * whether to show an option for sharing the current tab in the screen share
   * prompt. Screen sharing current tab might lead to hall of mirrors effect.
   * Default is exclude, if either of forceCurrentTab or preferCurrentTab are true,
   * this is set to include.
   * @default exclude
   */
  selfBrowserSurface?: 'include' | 'exclude';
  /**
   * whether to hint browser to show a "share this tab instead" option when
   * tab is shared.
   * Default is include, set to exclude if forceCurrentTab is true
   * @default include
   */
  surfaceSwitching?: 'include' | 'exclude';
  /**
   * whether to show option for sharing system level audio if full screen
   * is being shared. Not applicable if isVideoOnly is true.
   * Note that sharing system audio will cause echo if mic is on.
   * @default exclude
   */
  systemAudio?: 'include' | 'exclude';
  /**
   * used for region capture in screenshare, if the current tab is being screenshared
   * the screenshare video track will be cropped to only this element. Will throw
   * error if the element is not present in DOM.
   */
  cropElement?: HTMLDivElement;
  /**
   * used for region capture in screenshare, the screenshare video track will be
   * cropped to only the passed in cropTarget. This cropTarget must come from
   * the tab which is being shared
   */
  cropTarget?: object;
}

export interface ScreenCaptureHandle {
  handle: string;
  exposeOrigin: boolean;
}

export interface ScreenCaptureHandleConfig extends ScreenCaptureHandle {
  permittedOrigins: string[];
}
