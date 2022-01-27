import { createSelector } from 'reselect';
import { HMSLocalTrackStats } from '../hmsSDKStore/sdkTypes';
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
const localPeerStats = createSelector(
  [selectPeerStatsMap, selectLocalPeerID],
  (storePeerStats, localPeerID) => storePeerStats[localPeerID],
);

/**
 *  The total number of packets lost during the call
 */
const packetsLost = createSelector(localPeerStats, localPeerStats => localPeerStats?.subscribe?.packetsLost);

const jitter = createSelector(localPeerStats, localPeerStats => localPeerStats?.subscribe?.jitter);

/**
 * The bitrate at which all the local tracks are being published at
 */
const publishBitrate = createSelector(localPeerStats, localPeerStats => localPeerStats?.publish?.bitrate);

/**
 * The bitrate at which all the remote tracks are being received at
 */
const subscribeBitrate = createSelector(localPeerStats, localPeerStats => localPeerStats?.subscribe?.bitrate);

/**
 * The total bitrate available for publishing
 */
const availablePublishBitrate = createSelector(
  localPeerStats,
  localPeerStats => localPeerStats?.publish?.availableOutgoingBitrate,
);

/**
 * The total bitrate available for subscribing to remote peers
 */
const availableSubscribeBitrate = createSelector(
  localPeerStats,
  localPeerStats => localPeerStats?.subscribe?.availableIncomingBitrate,
);

/**
 * The total bytes sent by the local peer
 */
const totalBytesSent = createSelector(localPeerStats, localPeerStats => localPeerStats?.publish?.bytesSent);

/**
 * The total bytes received by the local peer
 */
const totalBytesReceived = createSelector(localPeerStats, localPeerStats => localPeerStats?.subscribe?.bytesReceived);

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
const peerStatsByID = byIDCurry(selectPeerStatsByIDBare);

/**
 * Stats(bitrate, bytes sent/received, framerate, FPS, etc...) for a single track
 */
const trackStatsByID = byIDCurry(selectTrackStatsByIDBare);

/**
 * The bitrate at which the track's data is being received
 */
const bitrateByTrackID = byIDCurry(createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.bitrate));

/**
 * Bytes received from a particular track
 */
const bytesReceivedByTrackID = byIDCurry(
  createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.bytesReceived),
);

/**
 * The framerate(frames per second) of a particular video track
 */
const framerateByTrackID = byIDCurry(
  createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.framesPerSecond),
);

/**
 * The jitter faced while receiving a particular track
 */
const jitterByTrackID = byIDCurry(createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.jitter));

/**
 * The number of packets lost while receiving a particular track
 */
const packetsLostByTrackID = byIDCurry(createSelector(selectTrackStatsByIDBare, trackStats => trackStats?.packetsLost));

/**
 * Local track stats selectors
 */

const localAudioTrackStats = createSelector([selectTrackStatsMap, selectLocalAudioTrackID], (trackStatsMap, trackID) =>
  trackID ? (trackStatsMap[trackID] as HMSLocalTrackStats) : undefined,
);

const localVideoTrackStats = createSelector([selectTrackStatsMap, selectLocalVideoTrackID], (trackStatsMap, trackID) =>
  trackID ? (trackStatsMap[trackID] as HMSLocalTrackStats) : undefined,
);

const localAudioTrackBitrate = createSelector(localAudioTrackStats, stats => stats?.bitrate);
const localVideoTrackBitrate = createSelector(localVideoTrackStats, stats => stats?.bitrate);

const localAudioTrackBytesSent = createSelector(localAudioTrackStats, stats => stats?.bytesSent);
const localVideoTrackBytesSent = createSelector(localVideoTrackStats, stats => stats?.bytesSent);

const localVideoTrackFramerate = createSelector(localVideoTrackStats, stats => stats?.framesPerSecond);

const localVideoTrackQualityLimitationReason = createSelector(
  localVideoTrackStats,
  stats => stats?.qualityLimitationReason,
);

export const selectHMSStats = {
  localPeerStats,
  packetsLost,
  jitter,
  publishBitrate,
  subscribeBitrate,
  availablePublishBitrate,
  availableSubscribeBitrate,
  totalBytesSent,
  totalBytesReceived,
  peerStatsByID,
  trackStatsByID,
  bitrateByTrackID,
  bytesReceivedByTrackID,
  framerateByTrackID,
  jitterByTrackID,
  packetsLostByTrackID,
  localAudioTrackStats,
  localVideoTrackStats,
  localAudioTrackBitrate,
  localVideoTrackBitrate,
  localAudioTrackBytesSent,
  localVideoTrackBytesSent,
  localVideoTrackFramerate,
  localVideoTrackQualityLimitationReason,
};
