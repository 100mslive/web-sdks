import * as sdkTypes from '../sdkTypes';
import { HMSNotificationTypes } from '../../schema';

interface notifcationMap {
  [key: number]: string;
}

export const PEER_NOTIFICATION_TYPES: notifcationMap = {
  [sdkTypes.HMSPeerUpdate.PEER_JOINED]: HMSNotificationTypes.PEER_JOINED,
  [sdkTypes.HMSPeerUpdate.PEER_LEFT]: HMSNotificationTypes.PEER_LEFT,
  [sdkTypes.HMSPeerUpdate.ROLE_UPDATED]: HMSNotificationTypes.ROLE_UPDATED,
  [sdkTypes.HMSPeerUpdate.AUDIO_TOGGLED]: 'PEER_AUDIO_UPDATED',
  [sdkTypes.HMSPeerUpdate.VIDEO_TOGGLED]: 'PEER_VIDEO_UPDATED',
};

export const TRACK_NOTIFICATION_TYPES: notifcationMap = {
  [sdkTypes.HMSTrackUpdate.TRACK_ADDED]: HMSNotificationTypes.TRACK_ADDED,
  [sdkTypes.HMSTrackUpdate.TRACK_REMOVED]: HMSNotificationTypes.TRACK_REMOVED,
  [sdkTypes.HMSTrackUpdate.TRACK_MUTED]: HMSNotificationTypes.TRACK_MUTED,
  [sdkTypes.HMSTrackUpdate.TRACK_UNMUTED]: HMSNotificationTypes.TRACK_UNMUTED,
};
