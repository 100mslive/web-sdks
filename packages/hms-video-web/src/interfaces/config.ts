import InitialSettings from './settings';

/**
 * the config object tells the sdk options you want to join with
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
   * highly recommended to pass this as true, this will make sdk use the local storage
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
}

export type { InitialSettings as HMSConfigInitialSettings };
