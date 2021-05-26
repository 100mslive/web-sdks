export type HMSPeerID = string;
export type HMSTrackID = string;
export type HMSTrackSource = 'regular' | 'screen' | 'plugin';
export type HMSTrackType = 'audio' | 'video';

/**
 * HMSPeer stores the details of individual participants in the room
 */
export interface HMSPeer {
  id: HMSPeerID;
  name: string;
  role?: string;
  isLocal: boolean;
  isStarred?: boolean;
  videoTrack?: HMSTrackID;
  audioTrack?: HMSTrackID;
  auxiliaryTracks: HMSTrackID[];
}

/**
 * HMS Track stores details about individual tracks of the room. This object is
 * not meant to be used normally for UI interfaces, as interactions with this object
 * should be kept to bare minimum.
 * enabled - tells the real track enabled status, use this to call attach/detach video
 * displayEnabled - can be used to give immediate feedback to the user on button click
 */
export interface HMSTrack {
  id: HMSTrackID;
  source?: HMSTrackSource;
  type: HMSTrackType;
  enabled: boolean;
  height?: number;
  width?: number;
  displayEnabled?: boolean;
}

/**
 * HMS Speaker stores the details of peers speaking at any point of time along with
 * their audio levels. This can be used to current speakers or highlight videotiles.
 *
 * @privateRemarks
 * This is a separate interface instead of being part of the HMSPeer interface as the
 * corresponding update is high frequency.
 */
export interface HMSSpeaker {
  audioLevel?: number;
}
