import { HMSSdk, HMSWebrtcStats } from '@100mslive/hms-video';
import { selectLocalPeerID, selectPeerNameByID, selectRoomState, selectTracksMap } from '../selectors';
import { IHMSStore, IHMSInternalsStore } from '../IHMSStore';
import { HMSPeerID, HMSRoomState, HMSTrack, HMSTrackID, HMSPeerStats, HMSTrackStats } from '../schema';
import { mergeNewIndividualStatsInDraft } from './sdkUtils/storeMergeUtils';
import { SDKToHMS } from './adapter';
import { isPresent } from './common/presence';

export const subscribeToSdkWebrtcStats = (sdk: HMSSdk, webrtcStore: IHMSInternalsStore, store: IHMSStore) => {
  let unsubscribe: (() => void) | undefined;
  store.subscribe(roomState => {
    if (roomState === HMSRoomState.Connected) {
      // storePeerConnections(sdk, webrtcStore);
      unsubscribe = sdk.getWebrtcInternals()?.onStatsChange(stats => updateWebrtcStoreStats(webrtcStore, stats, store));
    } else {
      if (unsubscribe) {
        unsubscribe();
      }
    }
  }, selectRoomState);
};

const updateWebrtcStoreStats = (webrtcStore: IHMSInternalsStore, stats: HMSWebrtcStats, hmsStore: IHMSStore) => {
  const tracks: Record<HMSTrackID, HMSTrack> = hmsStore.getState(selectTracksMap);
  webrtcStore.namedSetState(store => {
    if (store.jitter !== stats.getJitter()) {
      store.jitter = stats.getJitter();
    }
    if (store.packetsLost !== stats.getPacketsLost()) {
      store.packetsLost = stats.getPacketsLost();
    }

    store.publishStats = SDKToHMS.convertConnectionStats(stats.getPublishStats());
    store.subscribeStats = SDKToHMS.convertConnectionStats(stats.getSubscribeStats());
    const newTrackStats: Record<HMSTrackID, HMSTrackStats> = {};
    const trackIDs = Object.keys(tracks);

    for (const trackID of trackIDs) {
      newTrackStats[trackID] = Object.assign({}, stats.getTrackStats(trackID), {
        peerID: tracks[trackID].peerId,
        peerName: hmsStore.getState(selectPeerNameByID(tracks[trackID].peerId)),
      });
    }

    mergeNewIndividualStatsInDraft<HMSTrackID, HMSTrackStats>(trackIDs, store.trackStats, newTrackStats);

    // @TODO: Include all peer stats, own ticket, transmit local peer stats to other peer's using biz
    const newPeerStats: Record<HMSPeerID, HMSPeerStats> = {};
    const peerIDs = [hmsStore.getState(selectLocalPeerID)];
    attachLocalPeerStats(
      hmsStore,
      store.peerStats[hmsStore.getState(selectLocalPeerID)],
      stats.getLocalPeerStats(),
      newPeerStats,
    );
    mergeNewIndividualStatsInDraft<HMSPeerID, HMSPeerStats>(peerIDs, store.peerStats, newPeerStats);
  }, 'webrtc-stats');
};

const attachLocalPeerStats = (
  hmsStore: IHMSStore,
  storeLocalPeerStats: HMSPeerStats | undefined,
  sdkLocalPeerStats: {
    publish: RTCIceCandidatePairStats | undefined;
    subscribe: RTCIceCandidatePairStats | undefined;
  },
  newPeerStats: Record<HMSPeerID, HMSPeerStats>,
) => {
  const localPeerID = hmsStore.getState(selectLocalPeerID);
  if (!newPeerStats[localPeerID]) {
    newPeerStats[localPeerID] = {};
  }
  // If prev stats is available
  if (storeLocalPeerStats) {
    newPeerStats[localPeerID] = attachBitrate(sdkLocalPeerStats, storeLocalPeerStats);
  } else {
    if (sdkLocalPeerStats.publish) {
      newPeerStats[localPeerID].publish = Object.assign(sdkLocalPeerStats.publish, { bitrate: 0 });
    }
    if (sdkLocalPeerStats.subscribe) {
      newPeerStats[localPeerID].subscribe = Object.assign(sdkLocalPeerStats.subscribe, { bitrate: 0 });
    }
  }
};

const attachBitrate = (
  newStats: {
    publish: RTCIceCandidatePairStats | undefined;
    subscribe: RTCIceCandidatePairStats | undefined;
  },
  oldStats?: HMSPeerStats,
): HMSPeerStats => {
  const publishBitrate = computeBitrate('bytesSent', newStats.publish, oldStats?.publish);
  const subscribeBitrate = computeBitrate('bytesReceived', newStats.subscribe, oldStats?.subscribe);

  const newPublishStats = Object.assign(newStats.publish, { bitrate: publishBitrate });
  const newSubscribeStats = Object.assign(newStats.subscribe, { bitrate: subscribeBitrate });

  return { publish: newPublishStats, subscribe: newSubscribeStats };
};

/**
 * Ref: https://github.dev/peermetrics/webrtc-stats/blob/b5c1fed68325543e6f563c6d3f4450a4b51e12b7/src/utils.ts#L62
 */
const computeBitrate = (
  statName: keyof RTCIceCandidatePairStats,
  newReport?: RTCIceCandidatePairStats,
  oldReport?: RTCIceCandidatePairStats,
): number => {
  const newVal = newReport && newReport[statName];
  const oldVal = oldReport ? oldReport[statName] : null;
  if (newReport && oldReport && isPresent(newVal) && isPresent(oldVal)) {
    // Type not null checked in `isPresent`
    // * 8 - for bytes to bits
    // * 1000 - ms to s
    return (((newVal as number) - (oldVal as number)) / (newReport.timestamp - oldReport.timestamp)) * 1000 * 8;
  } else {
    return 0;
  }
};

// const storePeerConnections = (sdk: HMSSdk, store: IHMSInternalsStore) => {
//   store.namedSetState(store => {
//     store.publishConnection = sdk.getWebrtcInternals()?.getPublishPeerConnection();
//     store.subscribeConnection = sdk.getWebrtcInternals()?.getSubscribePeerConnection();
//   }, 'peer-connections');
// };
