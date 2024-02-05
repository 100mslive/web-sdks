import * as sdkTypes from '../../internal';
import { HMSNotificationTypes } from '../../schema/notification';

type PeerNotificationMap = { [key in sdkTypes.HMSPeerUpdate]?: HMSNotificationTypes };

export const PEER_NOTIFICATION_TYPES: PeerNotificationMap = {
  [sdkTypes.HMSPeerUpdate.PEER_JOINED]: HMSNotificationTypes.PEER_JOINED,
  [sdkTypes.HMSPeerUpdate.PEER_LEFT]: HMSNotificationTypes.PEER_LEFT,
  [sdkTypes.HMSPeerUpdate.ROLE_UPDATED]: HMSNotificationTypes.ROLE_UPDATED,
  [sdkTypes.HMSPeerUpdate.NAME_UPDATED]: HMSNotificationTypes.NAME_UPDATED,
  [sdkTypes.HMSPeerUpdate.METADATA_UPDATED]: HMSNotificationTypes.METADATA_UPDATED,
  [sdkTypes.HMSPeerUpdate.HAND_RAISE_CHANGED]: HMSNotificationTypes.HAND_RAISE_CHANGED,
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

type PollNotificationMap = { [key in sdkTypes.HMSPollsUpdate]: HMSNotificationTypes };

export const POLL_NOTIFICATION_TYPES: PollNotificationMap = {
  [sdkTypes.HMSPollsUpdate.POLL_CREATED]: HMSNotificationTypes.POLL_CREATED,
  [sdkTypes.HMSPollsUpdate.POLL_STARTED]: HMSNotificationTypes.POLL_STARTED,
  [sdkTypes.HMSPollsUpdate.POLL_STOPPED]: HMSNotificationTypes.POLL_STOPPED,
  [sdkTypes.HMSPollsUpdate.POLL_STATS_UPDATED]: HMSNotificationTypes.POLL_VOTES_UPDATED,
  [sdkTypes.HMSPollsUpdate.POLLS_LIST]: HMSNotificationTypes.POLLS_LIST,
  // [sdkTypes.HMSPollsUpdate.POLL_LEADERBOARD_SHARED]: HMSNotificationTypes.POLL_LEADERBOARD_SHARED,
};
