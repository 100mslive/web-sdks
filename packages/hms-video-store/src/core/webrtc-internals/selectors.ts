import { createSelector } from 'reselect';
import { HMSInternalsStore, HMSPeerID, HMSTrackID } from '../schema';
import { byIDCurry } from '../selectors/common';

export const packetsLost = (store: HMSInternalsStore) => store.packetsLost;

export const jitter = (store: HMSInternalsStore) => store.jitter;

const selectLocalPeerID = (store: HMSInternalsStore) => store.localPeer.id;
const selectLocalAudioTrackID = (store: HMSInternalsStore) => store.localPeer.audioTrack;
const selectLocalVideoTrackID = (store: HMSInternalsStore) => store.localPeer.videoTrack;
const selectPeerID = (_store: HMSInternalsStore, peerID: HMSPeerID | undefined) => peerID;
const selectTrackID = (_store: HMSInternalsStore, trackID: HMSTrackID | undefined) => trackID;
const selectTrackStatsMap = (store: HMSInternalsStore) => store.trackStats;
const selectPeerStatsMap = (store: HMSInternalsStore) => store.peerStats;

/**
 * Local peer stats selectors
 */
export const localPeerStats = createSelector(
  [selectPeerStatsMap, selectLocalPeerID],
  (storePeerStats, localPeerID) => storePeerStats[localPeerID],
);

export const publishBitrate = createSelector(localPeerStats, localPeerStats => localPeerStats?.publish?.bitrate);

export const subscribeBitrate = createSelector(localPeerStats, localPeerStats => localPeerStats?.subscribe?.bitrate);

export const availablePublishBitrate = createSelector(
  localPeerStats,
  localPeerStats => localPeerStats?.publish?.availableOutgoingBitrate,
);

export const availableSubscribeBitrate = createSelector(
  localPeerStats,
  localPeerStats => localPeerStats?.subscribe?.availableIncomingBitrate,
);

export const totalBytesSent = createSelector(localPeerStats, localPeerStats => localPeerStats?.publish?.bytesSent);

export const totalBytesReceived = createSelector(
  localPeerStats,
  localPeerStats => localPeerStats?.subscribe?.bytesReceived,
);

/**
 * By ID Selectors
 * To be used for remote tracks
 */

const selectPeerStatsByIDBare = createSelector([selectPeerStatsMap, selectPeerID], (storePeerStats, peerID) =>
  peerID ? storePeerStats[peerID] : undefined,
);

const selectTrackStatsByIDBare = createSelector([selectTrackStatsMap, selectTrackID], (storeTrackStats, trackID) =>
  trackID ? storeTrackStats[trackID] : undefined,
);

export const peerStatsByID = byIDCurry(selectPeerStatsByIDBare);
export const trackStatsByID = byIDCurry(selectTrackStatsByIDBare);

export const bitrateByTrackID = byIDCurry(createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.bitrate));

export const bytesReceivedByTrackID = byIDCurry(
  createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.bytesReceived),
);

export const framerateByTrackID = byIDCurry(
  createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.framesPerSecond),
);

export const jitterByTrackID = byIDCurry(createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.jitter));

export const packetsLostByTrackID = byIDCurry(
  createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.packetsLost),
);

/**
 * Local track stats selectors
 */

export const localAudioTrackStats = createSelector(
  [selectTrackStatsMap, selectLocalAudioTrackID],
  (trackStatsMap, trackID) => (trackID ? trackStatsMap[trackID] : undefined),
);

export const localVideoTrackStats = createSelector(
  [selectTrackStatsMap, selectLocalVideoTrackID],
  (trackStatsMap, trackID) => (trackID ? trackStatsMap[trackID] : undefined),
);

export const localAudioTrackBitrate = createSelector(localAudioTrackStats, stats => stats?.bitrate);
export const localVideoTrackBitrate = createSelector(localVideoTrackStats, stats => stats?.bitrate);

export const localAudioTrackBytesSent = createSelector(localAudioTrackStats, stats => stats?.bytesSent);
export const localVideoTrackBytesSent = createSelector(localVideoTrackStats, stats => stats?.bytesSent);

export const localVideoTrackFramerate = createSelector(localVideoTrackStats, stats => stats?.framesPerSecond);

export const localVideoTrackQualityLimitationReason = createSelector(
  localVideoTrackStats,
  stats => stats?.qualityLimitationReason,
);
