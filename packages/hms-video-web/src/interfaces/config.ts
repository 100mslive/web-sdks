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
}

export type { InitialSettings as HMSConfigInitialSettings };
