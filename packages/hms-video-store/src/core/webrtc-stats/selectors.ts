import { createSelector } from 'reselect';
import { HMSStatsStore, HMSPeerID, HMSTrackID } from '../schema';
import { byIDCurry } from '../selectors/common';

const selectLocalPeerID = (store: HMSStatsStore) => store.localPeer.id;
const selectLocalAudioTrackID = (store: HMSStatsStore) => store.localPeer.audioTrack;
const selectLocalVideoTrackID = (store: HMSStatsStore) => store.localPeer.videoTrack;
const selectPeerID = (_store: HMSStatsStore, peerID: HMSPeerID | undefined) => peerID;
const selectTrackID = (_store: HMSStatsStore, trackID: HMSTrackID | undefined) => trackID;
const selectTrackStatsMap = (store: HMSStatsStore) => store.trackStats;
const selectPeerStatsMap = (store: HMSStatsStore) => store.peerStats;

/**
 * Local peer stats selectors
 */
export const localPeerStats = createSelector(
  [selectPeerStatsMap, selectLocalPeerID],
  (storePeerStats, localPeerID) => storePeerStats[localPeerID],
);

/**
 *  The total number of packets lost during the call
 */
export const packetsLost = createSelector(localPeerStats, localPeerStats => localPeerStats?.subscribe?.packetsLost);

export const jitter = createSelector(localPeerStats, localPeerStats => localPeerStats?.subscribe?.jitter);

/**
 * The bitrate at which all the local tracks are being published at
 */
export const publishBitrate = createSelector(localPeerStats, localPeerStats => localPeerStats?.publish?.bitrate);

/**
 * The bitrate at which all the remote tracks are being received at
 */
export const subscribeBitrate = createSelector(localPeerStats, localPeerStats => localPeerStats?.subscribe?.bitrate);

/**
 * The total bitrate available for publishing
 */
export const availablePublishBitrate = createSelector(
  localPeerStats,
  localPeerStats => localPeerStats?.publish?.availableOutgoingBitrate,
);

/**
 * The total bitrate available for subscribing to remote peers
 */
export const availableSubscribeBitrate = createSelector(
  localPeerStats,
  localPeerStats => localPeerStats?.subscribe?.availableIncomingBitrate,
);

/**
 * The total bytes sent by the local peer
 */
export const totalBytesSent = createSelector(localPeerStats, localPeerStats => localPeerStats?.publish?.bytesSent);

/**
 * The total bytes received by the local peer
 */
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

/**
 * Stats(bitrate, bytes sent/received, etc...) for a single peer given the peer ID
 */
export const peerStatsByID = byIDCurry(selectPeerStatsByIDBare);

/**
 * Stats(bitrate, bytes sent/received, framerate, FPS, etc...) for a single track
 */
export const trackStatsByID = byIDCurry(selectTrackStatsByIDBare);

/**
 * The bitrate at which the track's data is being received
 */
export const bitrateByTrackID = byIDCurry(createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.bitrate));

/**
 * Bytes received from a particular track
 */
export const bytesReceivedByTrackID = byIDCurry(
  createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.bytesReceived),
);

/**
 * The framerate(frames per second) of a particular video track
 */
export const framerateByTrackID = byIDCurry(
  createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.framesPerSecond),
);

/**
 * The jitter faced while receiving a particular track
 */
export const jitterByTrackID = byIDCurry(createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.jitter));

/**
 * The number of packets lost while receiving a particular track
 */
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
