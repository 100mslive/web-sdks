import { createSelector } from 'reselect';
import { HMSInternalsStore, HMSPeerID, HMSTrackID } from '../schema';
import { byIDCurry } from '../selectors/common';

export const selectPacketsLost = (store: HMSInternalsStore) => store.packetsLost;

export const selectJitter = (store: HMSInternalsStore) => store.jitter;

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
export const selectLocalPeerStats = createSelector(
  [selectPeerStatsMap, selectLocalPeerID],
  (storePeerStats, localPeerID) => storePeerStats[localPeerID],
);

export const selectPublishBitrate = createSelector(
  selectLocalPeerStats,
  localPeerStats => localPeerStats?.publish?.bitrate,
);

export const selectSubscribeBitrate = createSelector(
  selectLocalPeerStats,
  localPeerStats => localPeerStats?.subscribe?.bitrate,
);

export const selectAvailablePublishBitrate = createSelector(
  selectLocalPeerStats,
  localPeerStats => localPeerStats?.publish?.availableOutgoingBitrate,
);

export const selectAvailableSubscribeBitrate = createSelector(
  selectLocalPeerStats,
  localPeerStats => localPeerStats?.subscribe?.availableIncomingBitrate,
);

export const selectTotalBytesSent = createSelector(
  selectLocalPeerStats,
  localPeerStats => localPeerStats?.publish?.bytesSent,
);

export const selectTotalBytesReceived = createSelector(
  selectLocalPeerStats,
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

export const selectPeerStatsByID = byIDCurry(selectPeerStatsByIDBare);
export const selectTrackStatsByID = byIDCurry(selectTrackStatsByIDBare);

export const selectBitrateByTrackID = byIDCurry(
  createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.bitrate),
);

export const selectBytesReceivedByTrackID = byIDCurry(
  createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.bytesReceived),
);

export const selectFramerateByTrackID = byIDCurry(
  createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.framesPerSecond),
);

export const selectJitterByTrackID = byIDCurry(
  createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.jitter),
);

export const selectPacketsLostByTrackID = byIDCurry(
  createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.packetsLost),
);

/**
 * Local track stats selectors
 */

export const selectLocalAudioTrackStats = createSelector(
  [selectTrackStatsMap, selectLocalAudioTrackID],
  (trackStatsMap, trackID) => (trackID ? trackStatsMap[trackID] : undefined),
);

export const selectLocalVideoTrackStats = createSelector(
  [selectTrackStatsMap, selectLocalVideoTrackID],
  (trackStatsMap, trackID) => (trackID ? trackStatsMap[trackID] : undefined),
);

export const selectLocalAudioTrackBitrate = createSelector(selectLocalAudioTrackStats, stats => stats?.bitrate);
export const selectLocalVideoTrackBitrate = createSelector(selectLocalVideoTrackStats, stats => stats?.bitrate);

export const selectLocalAudioTrackBytesSent = createSelector(selectLocalAudioTrackStats, stats => stats?.bytesSent);
export const selectLocalVideoTrackBytesSent = createSelector(selectLocalVideoTrackStats, stats => stats?.bytesSent);

export const selectLocalVideoTrackFramerate = createSelector(
  selectLocalVideoTrackStats,
  stats => stats?.framesPerSecond,
);

export const selectLocalVideoTrackQualityLimitationReason = createSelector(
  selectLocalVideoTrackStats,
  stats => stats?.qualityLimitationReason,
);
