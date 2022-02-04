import { HMSSdk, HMSWebrtcStats, HMSPeerStats, HMSTrackStats } from '@100mslive/hms-video';
import {
  selectLocalAudioTrackID,
  selectLocalPeerID,
  selectLocalVideoTrackID,
  selectRoomState,
  selectTracksMap,
} from '../selectors';
import { IHMSStore, IHMSStatsStore } from '../IHMSStore';
import { HMSPeerID, HMSRoomState, HMSTrack, HMSTrackID, createDefaultStatsStore } from '../schema';
import { mergeNewIndividualStatsInDraft } from '../hmsSDKStore/sdkUtils/storeMergeUtils';

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
    const newTrackStats: Record<HMSTrackID, HMSTrackStats> = {};
    const trackIDs = Object.keys(tracks);

    for (const trackID of trackIDs) {
      const sdkTrackStats = stats.getTrackStats(trackID);
      if (sdkTrackStats) {
        newTrackStats[trackID] = sdkTrackStats;
      }
    }

    mergeNewIndividualStatsInDraft<HMSTrackID, HMSTrackStats>(store.trackStats, newTrackStats);

    // @TODO: Include all peer stats, own ticket, transmit local peer stats to other peer's using biz
    const localPeerID = hmsStore.getState(selectLocalPeerID);
    const newPeerStats = { [localPeerID]: stats.getLocalPeerStats() };
    mergeNewIndividualStatsInDraft<HMSPeerID, HMSPeerStats>(store.peerStats, newPeerStats);
  }, 'webrtc-stats');
};

const resetHMSStatsStore = (store: IHMSStatsStore, reason = 'resetState') => {
  store.namedSetState(draft => {
    Object.assign(draft, createDefaultStatsStore());
  }, reason);
};
