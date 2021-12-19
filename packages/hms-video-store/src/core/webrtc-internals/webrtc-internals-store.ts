import { HMSSdk, HMSWebrtcStats } from '@100mslive/hms-video';
import {
  selectLocalAudioTrackID,
  selectLocalPeerID,
  selectLocalVideoTrackID,
  selectPeerNameByID,
  selectRoomState,
  selectTracksMap,
} from '../selectors';
import { IHMSStore, IHMSInternalsStore } from '../IHMSStore';
import {
  HMSPeerID,
  HMSRoomState,
  HMSTrack,
  HMSTrackID,
  HMSPeerStats,
  HMSTrackStats,
  RTCTrackStats,
  createDefaultInternalsStore,
} from '../schema';
import { mergeNewIndividualStatsInDraft } from '../hmsSDKStore/sdkUtils/storeMergeUtils';
import { isPresent } from '../hmsSDKStore/common/presence';

export const subscribeToSdkWebrtcStats = (sdk: HMSSdk, webrtcStore: IHMSInternalsStore, store: IHMSStore) => {
  let unsubscribe: (() => void) | undefined;
  console.log('Subscribe Stats');
  /**
   * Connected to room, webrtc internals can be initialized
   */
  if (store.getState(selectRoomState) === HMSRoomState.Connected) {
    unsubscribe = sdk.getWebrtcInternals()?.onStatsChange(stats => updateWebrtcStoreStats(webrtcStore, stats, store));
  }

  /**
   * Subscribe to room state for 2 purposes:
   * - unsubscribe on leave
   * - if internals is called before join is completed, init internals when roomState changes to connected
   */
  store.subscribe(roomState => {
    console.log('Subscribe stats', roomState);
    if (roomState === HMSRoomState.Connected && !unsubscribe) {
      const unsubLocalPeer = updateLocalPeerInWebrtcStore(store, webrtcStore);

      const unsubSdkStats = sdk
        .getWebrtcInternals()
        ?.onStatsChange(stats => updateWebrtcStoreStats(webrtcStore, stats, store));

      unsubscribe = () => {
        unsubLocalPeer();
        unsubSdkStats && unsubSdkStats();
      };
    } else {
      if (unsubscribe) {
        resetHMSInternalsStore(webrtcStore);
        unsubscribe();
      }
    }
  }, selectRoomState);
};

const updateLocalPeerInWebrtcStore = (store: IHMSStore, webrtcStore: IHMSInternalsStore) => {
  const unsubID = store.subscribe(localPeerID => {
    webrtcStore.namedSetState(draft => {
      draft.localPeer.id = localPeerID;
    }, 'localpeer-id');
  }, selectLocalPeerID);

  const unsubVideoTrackID = store.subscribe(videoTrackID => {
    webrtcStore.namedSetState(draft => {
      draft.localPeer.videoTrack = videoTrackID;
    }, 'localpeer-videotrack-id');
  }, selectLocalVideoTrackID);

  const unsubAudioTrackID = store.subscribe(audioTrackID => {
    webrtcStore.namedSetState(draft => {
      draft.localPeer.videoTrack = audioTrackID;
    }, 'localpeer-audiotrack-id');
  }, selectLocalAudioTrackID);

  return () => {
    unsubID();
    unsubVideoTrackID();
    unsubAudioTrackID();
  };
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

    // Not used by UI
    // store.publishStats = SDKToHMS.convertConnectionStats(stats.getPublishStats());
    // store.subscribeStats = SDKToHMS.convertConnectionStats(stats.getSubscribeStats());

    const newTrackStats: Record<HMSTrackID, HMSTrackStats> = {};
    const trackIDs = Object.keys(tracks);

    for (const trackID of trackIDs) {
      newTrackStats[trackID] = attachTrackStats(
        hmsStore,
        tracks[trackID],
        stats.getTrackStats(trackID),
        store.trackStats[trackID],
      );
    }

    mergeNewIndividualStatsInDraft<HMSTrackID, HMSTrackStats>(store.trackStats, newTrackStats);

    // @TODO: Include all peer stats, own ticket, transmit local peer stats to other peer's using biz
    const newPeerStats = attachLocalPeerStats(
      hmsStore,
      store.peerStats[hmsStore.getState(selectLocalPeerID)],
      stats.getLocalPeerStats(),
    );
    mergeNewIndividualStatsInDraft<HMSPeerID, HMSPeerStats>(store.peerStats, newPeerStats);
  }, 'webrtc-stats');
};

const attachLocalPeerStats = (
  hmsStore: IHMSStore,
  storeLocalPeerStats: HMSPeerStats | undefined,
  sdkLocalPeerStats: {
    publish: RTCIceCandidatePairStats | undefined;
    subscribe: RTCIceCandidatePairStats | undefined;
  },
) => {
  const newPeerStats: Record<HMSPeerID, HMSPeerStats> = {};

  const localPeerID = hmsStore.getState(selectLocalPeerID);
  if (!newPeerStats[localPeerID]) {
    newPeerStats[localPeerID] = {};
  }
  // If prev stats is available
  if (storeLocalPeerStats) {
    newPeerStats[localPeerID] = attachPeerBitrate(sdkLocalPeerStats, storeLocalPeerStats);
  } else {
    if (sdkLocalPeerStats.publish) {
      newPeerStats[localPeerID].publish = Object.assign(sdkLocalPeerStats.publish, { bitrate: 0 });
    }
    if (sdkLocalPeerStats.subscribe) {
      newPeerStats[localPeerID].subscribe = Object.assign(sdkLocalPeerStats.subscribe, { bitrate: 0 });
    }
  }

  return newPeerStats;
};

const attachPeerBitrate = (
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

const attachTrackStats = (
  hmsStore: IHMSStore,
  track: HMSTrack,
  sdkTrackStats?: RTCTrackStats,
  storeTrackStats?: HMSTrackStats,
): HMSTrackStats => {
  const bitrate = computeBitrate<RTCTrackStats>(
    /**
     * @FIX type after TS has correct types for RTCInboundRtpStreamStats | RTCOutboundRtpStreamStats
     */
    (sdkTrackStats?.type === 'outbound-rtp' ? 'bytesSent' : 'bytesReceived') as any,
    sdkTrackStats,
    storeTrackStats,
  );
  return Object.assign(sdkTrackStats, {
    peerID: track.peerId,
    peerName: hmsStore.getState(selectPeerNameByID(track.peerId)),
    bitrate,
  });
};

/**
 * Ref: https://github.dev/peermetrics/webrtc-stats/blob/b5c1fed68325543e6f563c6d3f4450a4b51e12b7/src/utils.ts#L62
 */
const computeBitrate = <T extends RTCIceCandidatePairStats | RTCTrackStats>(
  statName: keyof T,
  newReport?: T,
  oldReport?: T,
): number => {
  const newVal = newReport && newReport[statName];
  const oldVal = oldReport ? oldReport[statName] : null;
  if (newReport && oldReport && isPresent(newVal) && isPresent(oldVal)) {
    // Type not null checked in `isPresent`
    // * 8 - for bytes to bits
    // * 1000 - ms to s
    return (
      (((newVal as unknown as number) - (oldVal as unknown as number)) / (newReport.timestamp - oldReport.timestamp)) *
      1000 *
      8
    );
  } else {
    return 0;
  }
};

const resetHMSInternalsStore = (store: IHMSInternalsStore, reason = 'resetState') => {
  store.namedSetState(draft => {
    Object.assign(draft, createDefaultInternalsStore());
  }, reason);
};
