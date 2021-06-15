import * as sdkTypes from '../sdkTypes';
import { HMSNotificationTypes } from '../../schema';

interface notifcationMap {
  [key: number]: string;
}

export const PEER_NOTIFICATION_TYPES: notifcationMap = {
  [sdkTypes.HMSPeerUpdate.PEER_JOINED]: HMSNotificationTypes.PEER_JOINED,
  [sdkTypes.HMSPeerUpdate.PEER_LEFT]: HMSNotificationTypes.PEER_LEFT,
  [sdkTypes.HMSPeerUpdate.AUDIO_TOGGLED]: 'PEER_AUDIO_UPDATED',
  [sdkTypes.HMSPeerUpdate.VIDEO_TOGGLED]: 'PEER_VIDEO_UPDATED',
};
