import { HMSSdk, HMSWebrtcStats } from '@100mslive/hms-video';
import {
  selectLocalAudioTrackID,
  selectLocalPeerID,
  selectLocalVideoTrackID,
  selectPeerNameByID,
  selectRoomState,
  selectTracksMap,
} from '../selectors';
import { IHMSStore, IHMSStatsStore } from '../IHMSStore';
import {
  HMSPeerID,
  HMSRoomState,
  HMSTrack,
  HMSTrackID,
  HMSPeerStats,
  HMSTrackStats,
  RTCTrackStats,
  createDefaultStatsStore,
} from '../schema';
import { mergeNewIndividualStatsInDraft } from '../hmsSDKStore/sdkUtils/storeMergeUtils';
import { isPresent } from '../hmsSDKStore/common/presence';

type Unsubscribe = (() => void) | undefined;
export const subscribeToSdkWebrtcStats = (sdk: HMSSdk, webrtcStore: IHMSStatsStore, store: IHMSStore) => {
  let unsubscribe: Unsubscribe;
  /**
   * Connected to room, webrtc internals can be initialized
   */
  if (store.getState(selectRoomState) === HMSRoomState.Connected) {
    unsubscribe = initAndSubscribeWebrtcStore(sdk, webrtcStore, store);
  }

  /**
   * Subscribe to room state for 2 purposes:
   * - unsubscribe on leave
   * - if internals is called before join is completed, init internals when roomState changes to connected
   */
  store.subscribe(roomState => {
    if ([HMSRoomState.Connected, HMSRoomState.Reconnecting].includes(roomState)) {
      if (!unsubscribe) {
        unsubscribe = initAndSubscribeWebrtcStore(sdk, webrtcStore, store);
      }
    } else {
      if (unsubscribe) {
        resetHMSStatsStore(webrtcStore);
        unsubscribe();
      }
    }
  }, selectRoomState);
};

const initAndSubscribeWebrtcStore = (sdk: HMSSdk, webrtcStore: IHMSStatsStore, store: IHMSStore) => {
  const unsubLocalPeer = updateLocalPeerInWebrtcStore(store, webrtcStore);

  const unsubSdkStats = sdk
    .getWebrtcInternals()
    ?.onStatsChange(stats => updateWebrtcStoreStats(webrtcStore, stats, store));

  return () => {
    unsubLocalPeer();
    unsubSdkStats && unsubSdkStats();
  };
};

const updateLocalPeerInWebrtcStore = (store: IHMSStore, webrtcStore: IHMSStatsStore) => {
  let unsubID: Unsubscribe, unsubVideoTrackID: Unsubscribe, unsubAudioTrackID: Unsubscribe;
  if (store.getState(selectLocalPeerID)) {
    webrtcStore.namedSetState(draft => {
      draft.localPeer.id = store.getState(selectLocalPeerID);
    }, 'localpeer-id');
  } else {
    unsubID = store.subscribe(localPeerID => {
      localPeerID &&
        webrtcStore.namedSetState(draft => {
          draft.localPeer.id = localPeerID;
        }, 'localpeer-id');
    }, selectLocalPeerID);
  }

  if (store.getState(selectLocalVideoTrackID)) {
    webrtcStore.namedSetState(draft => {
      draft.localPeer.videoTrack = store.getState(selectLocalVideoTrackID);
    }, 'localpeer-videotrack-id');
  } else {
    unsubVideoTrackID = store.subscribe(videoTrackID => {
      videoTrackID &&
        webrtcStore.namedSetState(draft => {
          draft.localPeer.videoTrack = videoTrackID;
        }, 'localpeer-videotrack-id');
    }, selectLocalVideoTrackID);
  }

  if (store.getState(selectLocalAudioTrackID)) {
    webrtcStore.namedSetState(draft => {
      draft.localPeer.videoTrack = store.getState(selectLocalAudioTrackID);
    }, 'localpeer-audiotrack-id');
  } else {
    unsubAudioTrackID = store.subscribe(audioTrackID => {
      audioTrackID &&
        webrtcStore.namedSetState(draft => {
          draft.localPeer.videoTrack = audioTrackID;
        }, 'localpeer-audiotrack-id');
    }, selectLocalAudioTrackID);
  }

  return () => {
    unsubID?.();
    unsubVideoTrackID?.();
    unsubAudioTrackID?.();
  };
};

const updateWebrtcStoreStats = (webrtcStore: IHMSStatsStore, stats: HMSWebrtcStats, hmsStore: IHMSStore) => {
  const tracks: Record<HMSTrackID, HMSTrack> = hmsStore.getState(selectTracksMap);
  webrtcStore.namedSetState(store => {
    // Not used by UI
    // store.publishStats = SDKToHMS.convertConnectionStats(stats.getPublishStats());
    // store.subscribeStats = SDKToHMS.convertConnectionStats(stats.getSubscribeStats());

    const newTrackStats: Record<HMSTrackID, HMSTrackStats> = {};
    const trackIDs = Object.keys(tracks);

    for (const trackID of trackIDs) {
      const sdkTrackStats = stats.getTrackStats(trackID);
      if (sdkTrackStats) {
        newTrackStats[trackID] = attachTrackStats(hmsStore, tracks[trackID], sdkTrackStats, store.trackStats[trackID]);
      }
    }

    mergeNewIndividualStatsInDraft<HMSTrackID, HMSTrackStats>(store.trackStats, newTrackStats);

    // @TODO: Include all peer stats, own ticket, transmit local peer stats to other peer's using biz
    const newPeerStats = attachLocalPeerStats(hmsStore, store.peerStats[hmsStore.getState(selectLocalPeerID)], stats);
    mergeNewIndividualStatsInDraft<HMSPeerID, HMSPeerStats>(store.peerStats, newPeerStats);
  }, 'webrtc-stats');
};

const attachLocalPeerStats = (
  hmsStore: IHMSStore,
  storeLocalPeerStats: HMSPeerStats | undefined,
  sdkStats: HMSWebrtcStats,
) => {
  const sdkLocalPeerStats = sdkStats.getLocalPeerStats();
  const newPeerStats: Record<HMSPeerID, HMSPeerStats> = {};

  const localPeerID = hmsStore.getState(selectLocalPeerID);
  if (!newPeerStats[localPeerID]) {
    newPeerStats[localPeerID] = {};
  }
  // If prev stats is available
  if (storeLocalPeerStats) {
    newPeerStats[localPeerID] = attachPeerRates(sdkStats, storeLocalPeerStats);
  } else {
    if (sdkLocalPeerStats.publish) {
      newPeerStats[localPeerID].publish = Object.assign(sdkLocalPeerStats.publish, { bitrate: 0 });
    }
    if (sdkLocalPeerStats.subscribe) {
      newPeerStats[localPeerID].subscribe = Object.assign(
        sdkLocalPeerStats.subscribe,
        { bitrate: 0 },
        {
          packetsLost: sdkStats.getPacketsLost(),
          jitter: sdkStats.getJitter(),
          packetsLostRate: 0,
        },
      );
    }
  }

  return newPeerStats;
};

const attachPeerRates = (newSdkStats: HMSWebrtcStats, oldStats?: HMSPeerStats): HMSPeerStats => {
  const newStats = newSdkStats.getLocalPeerStats();

  const packetsLostRate = computeNumberRate(
    newSdkStats.getPacketsLost(),
    oldStats?.subscribe?.packetsLost,
    newStats.subscribe?.timestamp,
    oldStats?.subscribe?.timestamp,
  );
  const publishBitrate = computeBitrate('bytesSent', newStats.publish, oldStats?.publish);
  const subscribeBitrate = computeBitrate('bytesReceived', newStats.subscribe, oldStats?.subscribe);

  const newPublishStats = Object.assign(newStats.publish, { bitrate: publishBitrate });
  const newSubscribeStats = Object.assign(
    newStats.subscribe,
    { bitrate: subscribeBitrate },
    {
      packetsLost: newSdkStats.getPacketsLost(),
      jitter: newSdkStats.getJitter(),
      packetsLostRate,
    },
  );

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
): number => computeStatRate(statName, newReport, oldReport) * 8; // Bytes to bits

const computeStatRate = <T extends RTCIceCandidatePairStats | RTCTrackStats>(
  statName: keyof T,
  newReport?: T,
  oldReport?: T,
): number => {
  const newVal = newReport && newReport[statName];
  const oldVal = oldReport ? oldReport[statName] : null;
  if (newReport && oldReport && isPresent(newVal) && isPresent(oldVal)) {
    // Type not null checked in `isPresent`
    // * 1000 - ms to s
    return (
      computeNumberRate(
        newVal as unknown as number,
        oldVal as unknown as number,
        newReport.timestamp,
        oldReport.timestamp,
      ) * 1000
    );
  } else {
    return 0;
  }
};

const computeNumberRate = (newVal?: number, oldVal?: number, newTimestamp?: number, oldTimestamp?: number) => {
  if (isPresent(newVal) && isPresent(oldVal) && newTimestamp && oldTimestamp) {
    return ((newVal as number) - (oldVal as number)) / (newTimestamp - oldTimestamp);
  } else {
    return 0;
  }
};

const resetHMSStatsStore = (store: IHMSStatsStore, reason = 'resetState') => {
  store.namedSetState(draft => {
    Object.assign(draft, createDefaultStatsStore());
  }, reason);
};
