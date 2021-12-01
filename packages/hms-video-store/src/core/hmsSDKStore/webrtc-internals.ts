import { HMSSdk, HMSWebrtcStats } from '@100mslive/hms-video';
import { selectRoomState, selectTracksMap } from '../selectors';
import { IHMSStore, IHMSWebrtcInternalsStore } from '../IHMSStore';
import { HMSRoomState, HMSTrack, HMSTrackID } from '../schema';
import { mergeNewTrackStatsInDraft } from './sdkUtils/storeMergeUtils';

export const subscribeToSdkWebrtcStats = (sdk: HMSSdk, webrtcStore: IHMSWebrtcInternalsStore, store: IHMSStore) => {
  let unsubscribe: (() => void) | undefined;
  store.subscribe(roomState => {
    if (roomState === HMSRoomState.Connected) {
      storePeerConnections(sdk, webrtcStore);
      unsubscribe = sdk
        .getWebrtcInternals()
        ?.onStatsChange(stats => updateWebrtcStoreStats(webrtcStore, stats, store.getState(selectTracksMap)));
    } else {
      if (unsubscribe) {
        unsubscribe();
      }
    }
  }, selectRoomState);
};

const updateWebrtcStoreStats = (
  webrtcStore: IHMSWebrtcInternalsStore,
  stats: HMSWebrtcStats,
  tracks: Record<HMSTrackID, HMSTrack>,
) => {
  webrtcStore.namedSetState(store => {
    if (store.jitter !== stats.getJitter()) {
      store.jitter = stats.getJitter();
    }
    if (store.packetsLost !== stats.getPacketsLost()) {
      store.packetsLost = stats.getPacketsLost();
    }

    store.publishStats = stats.getPublishStats();
    store.subscribeStats = stats.getSubscribeStats();
    const newTrackStats: Record<HMSTrackID, Partial<RTCStats | undefined>> = {};
    const trackIDs = Object.keys(tracks);

    for (const trackID of trackIDs) {
      newTrackStats[trackID] = stats.getTrackStats(trackID);
    }

    mergeNewTrackStatsInDraft(tracks, store.trackStats, newTrackStats);
  }, 'webrtc-stats');
};

const storePeerConnections = (sdk: HMSSdk, store: IHMSWebrtcInternalsStore) => {
  store.namedSetState(store => {
    store.publishConnection = sdk.getWebrtcInternals()?.getPublishPeerConnection();
    store.subscribeConnection = sdk.getWebrtcInternals()?.getSubscribePeerConnection();
  }, 'peer-connections');
};
