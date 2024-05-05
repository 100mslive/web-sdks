import { HMSRoleName } from './role';
import {
  HMSPreferredSimulcastLayer,
  HMSSimulcastLayer,
  HMSSimulcastLayerDefinition,
  ScreenCaptureHandle,
} from '../interfaces';
import { HMSPeerType } from '../interfaces/peer/hms-peer';

export type HMSPeerID = string;
export type HMSTrackID = string;
export type HMSTrackSource = 'regular' | 'screen' | 'plugin' | 'audioplaylist' | 'videoplaylist' | string;
export type HMSTrackType = 'audio' | 'video';
export type HMSGroupName = string;
export type { HMSSimulcastLayerDefinition, HMSSimulcastLayer };
/**
 * Use this to identify what is being screenshared, not all browsers will support
 * everything.
 *
 * application - all windows of an application are shared
 * window - a particular window is being shared
 * monitor - full screen share of a monitor display
 * browser - a browser tab is shared
 * selfBrowser - the current browser tab is being shared
 */
export type HMSTrackDisplaySurface = 'application' | 'browser' | 'selfBrowser' | 'monitor' | 'window';
export type HMSTrackFacingMode = 'user' | 'environment' | 'left' | 'right';

/**
 * HMSPeer stores the details of individual participants in the room
 */
export interface HMSPeer {
  id: HMSPeerID;
  name: string;
  roleName?: HMSRoleName;
  isLocal: boolean;
  isStarred?: boolean;
  videoTrack?: HMSTrackID;
  audioTrack?: HMSTrackID;
  auxiliaryTracks: HMSTrackID[];
  customerUserId?: string;
  metadata?: string;
  joinedAt?: Date;
  groups?: HMSGroupName[];
  isHandRaised: boolean;
  type: HMSPeerType;
}

/**
 * HMS Track stores details about individual tracks of the room. This object is
 * not meant to be used normally for UI interfaces, as interactions with this object
 * should be kept to bare minimum.
 * enabled - tells the real track enabled status, use this to call attach/detach video
 * displayEnabled - can be used to give immediate feedback to the user on button click
 * deviceID - this is the ID of the source device for the track. This can be a dummy ID when track is on mute.
 * degraded - tells whether the track has been degraded(receiving lower video quality/no video) due to bad network locally
 */

interface BaseTrack {
  id: HMSTrackID;
  source?: HMSTrackSource;
  type: HMSTrackType;
  enabled: boolean;
  displayEnabled?: boolean;
  peerId?: string;
  deviceID?: string;
  plugins?: string[];
  /**
   * only applicable for local tracks - to denote if a track has been published or not
   * false for preview tracks
   */
  isPublished?: boolean;
}

export interface HMSAudioTrack extends BaseTrack {
  source: 'regular' | 'audioplaylist' | string;
  type: 'audio';
  volume?: number;
}
export interface HMSScreenAudioTrack extends HMSAudioTrack {
  source: 'screen';
  type: 'audio';
}
export interface HMSVideoTrack extends BaseTrack {
  source: 'regular' | 'videoplaylist' | string;
  type: 'video';
  facingMode?: HMSTrackFacingMode;
  layer?: HMSSimulcastLayer;
  preferredLayer?: HMSPreferredSimulcastLayer;
  layerDefinitions?: HMSSimulcastLayerDefinition[];
  height?: number;
  width?: number;
  degraded?: boolean;
}

export interface HMSScreenVideoTrack extends Omit<HMSVideoTrack, 'facingMode'> {
  source: 'screen';
  displaySurface?: HMSTrackDisplaySurface;
  /**
   * this can be used to identify the shared tab, if
   * the shared tab has set a captureHandle on its end as well as communicate
   * with the tab, for example using broadcast channel.
   */
  captureHandle?: ScreenCaptureHandle;
}

export type HMSTrack = HMSVideoTrack | HMSAudioTrack | HMSScreenVideoTrack | HMSScreenAudioTrack;

/**
 * HMS Speaker stores the details of peers speaking at any point of time along with
 * their audio levels. This can be used to current speakers or highlight video tiles.
 *
 * @privateRemarks
 * This is a separate interface instead of being part of the HMSPeer interface as the
 * corresponding update is high frequency.
 */
export interface HMSSpeaker {
  peerID: HMSPeerID;
  trackID: HMSTrackID;
  audioLevel: number;
}

export interface HMSPeerListIterator {
  hasNext(): boolean;
  next(): Promise<HMSPeer[]>;
  getTotal(): number;
  findPeers(): Promise<HMSPeer[]>;
}
