import { HMSNotificationTypes } from '../../schema';
import * as sdkTypes from '../sdkTypes';

type PeerNotificationMap = { [key in sdkTypes.HMSPeerUpdate]?: HMSNotificationTypes };

export const PEER_NOTIFICATION_TYPES: PeerNotificationMap = {
  [sdkTypes.HMSPeerUpdate.PEER_JOINED]: HMSNotificationTypes.PEER_JOINED,
  [sdkTypes.HMSPeerUpdate.PEER_LEFT]: HMSNotificationTypes.PEER_LEFT,
  [sdkTypes.HMSPeerUpdate.ROLE_UPDATED]: HMSNotificationTypes.ROLE_UPDATED,
  [sdkTypes.HMSPeerUpdate.NAME_UPDATED]: HMSNotificationTypes.NAME_UPDATED,
  [sdkTypes.HMSPeerUpdate.METADATA_UPDATED]: HMSNotificationTypes.METADATA_UPDATED,
};

type TrackNotificationMap = { [key in sdkTypes.HMSTrackUpdate]: HMSNotificationTypes };
export const TRACK_NOTIFICATION_TYPES: TrackNotificationMap = {
  [sdkTypes.HMSTrackUpdate.TRACK_ADDED]: HMSNotificationTypes.TRACK_ADDED,
  [sdkTypes.HMSTrackUpdate.TRACK_REMOVED]: HMSNotificationTypes.TRACK_REMOVED,
  [sdkTypes.HMSTrackUpdate.TRACK_MUTED]: HMSNotificationTypes.TRACK_MUTED,
  [sdkTypes.HMSTrackUpdate.TRACK_UNMUTED]: HMSNotificationTypes.TRACK_UNMUTED,
  [sdkTypes.HMSTrackUpdate.TRACK_DEGRADED]: HMSNotificationTypes.TRACK_DEGRADED,
  [sdkTypes.HMSTrackUpdate.TRACK_RESTORED]: HMSNotificationTypes.TRACK_RESTORED,
  [sdkTypes.HMSTrackUpdate.TRACK_DESCRIPTION_CHANGED]: HMSNotificationTypes.TRACK_DESCRIPTION_CHANGED,
};
