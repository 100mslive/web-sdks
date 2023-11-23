import { IHMSStatsStore, IHMSStore } from '../IHMSStore';
import { HMSPeerStats, HMSTrackStats } from '../interfaces';
import { mergeLocalTrackStats, mergeNewIndividualStatsInDraft } from '../reactive-store/sdkUtils/storeMergeUtils';
import { HMSWebrtcStats } from '../rtc-stats';
import { createDefaultStatsStore, HMSPeerID, HMSRoomState, HMSTrack, HMSTrackID } from '../schema';
import { HMSSdk } from '../sdk';
import {
  selectLocalAudioTrackID,
  selectLocalPeerID,
  selectLocalVideoTrackID,
  selectRoomState,
  selectTracksMap,
} from '../selectors';

type Unsubscribe = (() => void) | undefined;
export const subscribeToSdkWebrtcStats = (sdk: HMSSdk, webrtcStore: IHMSStatsStore, store: IHMSStore) => {
  // also used as flag to check if webrtc internals has been initialised
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
      // room state can go to disconnecting and back to connected if leave fails, we don't want to resubscribe in that case
    } else if ([HMSRoomState.Disconnected, HMSRoomState.Failed].includes(roomState)) {
      if (unsubscribe) {
        resetHMSStatsStore(webrtcStore, roomState);
        unsubscribe();
        // set flag to defined after unsubscribing to enable subscribing again
        unsubscribe = undefined;
      }
    }
  }, selectRoomState);
};

const initAndSubscribeWebrtcStore = (sdk: HMSSdk, webrtcStore: IHMSStatsStore, store: IHMSStore) => {
  const unsubLocalPeer = updateLocalPeerInWebrtcStore(store, webrtcStore);

  sdk.getWebrtcInternals()?.start();
  const unsubSdkStats = sdk
    .getWebrtcInternals()
    ?.onStatsChange(stats => updateWebrtcStoreStats(webrtcStore, stats, store, sdk));

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
      draft.localPeer.audioTrack = store.getState(selectLocalAudioTrackID);
    }, 'localpeer-audiotrack-id');
  } else {
    unsubAudioTrackID = store.subscribe(audioTrackID => {
      audioTrackID &&
        webrtcStore.namedSetState(draft => {
          draft.localPeer.audioTrack = audioTrackID;
        }, 'localpeer-audiotrack-id');
    }, selectLocalAudioTrackID);
  }

  return () => {
    unsubID?.();
    unsubVideoTrackID?.();
    unsubAudioTrackID?.();
  };
};

const updateWebrtcStoreStats = (
  webrtcStore: IHMSStatsStore,
  stats: HMSWebrtcStats,
  hmsStore: IHMSStore,
  sdk: HMSSdk,
) => {
  const tracks: Record<HMSTrackID, HMSTrack> = hmsStore.getState(selectTracksMap);
  webrtcStore.namedSetState(store => {
    const localPeerID = hmsStore.getState(selectLocalPeerID);
    const newTrackStats: Record<HMSTrackID, HMSTrackStats> = {};
    const trackIDs = Object.keys(tracks).filter(trackID => tracks[trackID].peerId !== localPeerID);

    for (const trackID of trackIDs) {
      const sdkTrackStats = stats.getRemoteTrackStats(trackID);
      if (sdkTrackStats) {
        newTrackStats[trackID] = sdkTrackStats;
      }
    }

    mergeNewIndividualStatsInDraft<HMSTrackID, HMSTrackStats>(store.remoteTrackStats, newTrackStats);

    // @TODO: Include all peer stats, own ticket, transmit local peer stats to other peer's using biz
    const newPeerStats = { [localPeerID]: stats.getLocalPeerStats() };
    mergeNewIndividualStatsInDraft<HMSPeerID, HMSPeerStats>(store.peerStats, newPeerStats);
    // @ts-ignore
    mergeLocalTrackStats(store.localTrackStats, stats.getLocalTrackStats(), sdk.store.getLocalPeerTracks());
  }, 'webrtc-stats');
};

const resetHMSStatsStore = (store: IHMSStatsStore, reason = 'resetState') => {
  store.namedSetState(draft => {
    Object.assign(draft, createDefaultStatsStore());
  }, reason);
};
