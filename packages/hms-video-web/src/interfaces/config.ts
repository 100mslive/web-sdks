import InitialSettings from './settings';

/**
 * the config object tells the SDK options you want to join with
 * @link https://docs.100ms.live/javascript/v2/features/preview
 * @link https://docs.100ms.live/javascript/v2/features/join
 */
export interface HMSConfig {
  /**
   * the name of the peer, can be later accessed via peer.name and can also be changed mid call.
   * @link https://docs.100ms.live/javascript/v2/features/peer-name
   */
  userName: string;
  /**
   * client token which encodes room id and role to join with
   * @link https://docs.100ms.live/javascript/v2/foundation/security-and-tokens
   */
  authToken: string;
  /**
   * optional metadata which can be attached with a peer. This can also be changed mid call.
   * @link https://docs.100ms.live/javascript/v2/advanced-features/peer-metadata
   */
  metaData?: string;
  /**
   * initial settings for audio/video and device to be used. Please don't pass
   * this field while joining if you're using preview, the state changes in preview will be remembered
   * across to join.
   */
  settings?: InitialSettings;
  /**
   * highly recommended to pass this as true, this will make SDK use the local storage
   * to remember any manual device selection for future joins.
   */
  rememberDeviceSelection?: boolean;
  audioSinkElementId?: string;
  autoVideoSubscribe?: boolean;
  initEndpoint?: string;
  /**
   * Request Camera/Mic permissions irrespective of role to avoid delay in getting device list
   */
  alwaysRequestPermissions?: boolean;
  /**
   * Enable to get a network quality score while in preview. The score ranges from -1 to 5.
   * -1 when we are not able to connect to 100ms servers within an expected time limit
   * 0 when there is a timeout/failure when measuring the quality
   * 1-5 ranges from poor to good quality.
   */
  captureNetworkQualityInPreview?: boolean;
  /**
   * if this flag is enabled, the SDK takes care of unsubscribing to the video when it goes out of view.
   * Additionally if simulcast is enabled, it takes care of auto managing simulcast layers based on the
   * dimensions of the video element to conserve bandwidth.
   */
  autoManageVideo?: boolean;
  /**
   * if this flag is enabled, wake lock will be acquired automatically(if supported) when joining the room, so the device
   * will be kept awake.
   */
  autoManageWakeLock?: boolean;
}

export interface HMSMidCallPreviewConfig {
  /** the role that would be used for preview, note that the role from token would be used to join  */
  asRole?: string;
  /**
   * initial settings for audio/video and device to be used. Please don't pass
   * this field while joining if you're using preview, the state changes in preview will be remembered
   * across to join.
   */
  settings?: InitialSettings;
}

/**
 * the config object tells the SDK options you want to preview with(use if you want preview and join with different roles)
 * @link https://docs.100ms.live/javascript/v2/features/preview
 */
export interface HMSPreviewConfig extends HMSConfig, HMSMidCallPreviewConfig {}

export type { InitialSettings as HMSConfigInitialSettings };
