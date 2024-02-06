import { createSelector } from 'reselect';
import { HMSPreferredSimulcastLayer, RID, simulcastMapping } from '../internal';
import { HMSPeerID, HMSStatsStore, HMSTrackID } from '../schema';
import { byIDCurry } from '../selectors/common';

const selectLocalPeerID = (store: HMSStatsStore) => store.localPeer.id;
const selectLocalAudioTrackID = (store: HMSStatsStore) => store.localPeer.audioTrack;
const selectLocalVideoTrackID = (store: HMSStatsStore) => store.localPeer.videoTrack;
const selectPeerID = (_store: HMSStatsStore, peerID: HMSPeerID | undefined) => peerID;
const selectTrackID = (_store: HMSStatsStore, trackID: HMSTrackID | undefined) => trackID;
const selectRemoteTrackStatsMap = (store: HMSStatsStore) => store.remoteTrackStats;
const selectPeerStatsMap = (store: HMSStatsStore) => store.peerStats;
const selectLocalTrackStatsMap = (store: HMSStatsStore) => store.localTrackStats;

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

const selectTrackStatsByIDBare = createSelector(
  [selectRemoteTrackStatsMap, selectTrackID],
  (storeTrackStats, trackID) => (trackID ? storeTrackStats[trackID] : undefined),
);

const selectLocalTrackStatsByIDBare = createSelector(
  [selectLocalTrackStatsMap, selectTrackID],
  (storeLocalTrackStats, trackID) => (trackID ? storeLocalTrackStats[trackID] : undefined),
);

/**
 * Stats(bitrate, bytes sent/received, etc...) for a single peer given the peer ID
 */
const peerStatsByID = byIDCurry(selectPeerStatsByIDBare);

/**
 * Stats(bitrate, bytes sent/received, framerate, FPS, etc...) for a remote track
 */
const trackStatsByID = byIDCurry(selectTrackStatsByIDBare);

/**
 * Local track stats selectors
 */

const localAudioTrackStats = createSelector(
  [selectLocalTrackStatsMap, selectLocalAudioTrackID],
  (trackStats, trackID) => (trackID ? trackStats[trackID]?.[0] : undefined),
);

const localAudioTrackStatsByID = byIDCurry(
  createSelector(selectLocalTrackStatsByIDBare, trackStats => trackStats?.[0]),
);

const localVideoTrackStats = createSelector(
  [selectLocalTrackStatsMap, selectLocalVideoTrackID],
  (trackStats, trackID) => (trackID ? trackStats[trackID]?.[0] : undefined),
);

const localVideoTrackStatsByID = byIDCurry(createSelector(selectLocalTrackStatsByIDBare, trackStats => trackStats));

const localVideoTrackStatsByLayer = (layer?: HMSPreferredSimulcastLayer) =>
  byIDCurry(
    createSelector(selectLocalTrackStatsByIDBare, stats => {
      const rid = (Object.keys(simulcastMapping) as RID[]).find(key => simulcastMapping[key] === layer);
      return layer ? stats?.find(stat => stat.rid === rid) || stats?.[0] : stats?.[0];
    }),
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
  localAudioTrackStatsByID,
  localVideoTrackStatsByID,
  localVideoTrackStatsByLayer,
  localAudioTrackStats,
  localVideoTrackStats,
};
