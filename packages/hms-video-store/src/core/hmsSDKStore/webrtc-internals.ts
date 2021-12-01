import { HMSSdk, HMSWebrtcStats } from '@100mslive/hms-video';
import { selectRoomState, selectTracksMap } from '../selectors';
import { IHMSStore, IHMSWebrtcInternalsStore } from '../IHMSStore';
import { HMSRoomState, HMSTrack, HMSTrackID } from '~core';
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
  webrtcStore.setState(store => {
    if (store.jitter !== stats.getJitter()) {
      store.jitter = stats.getJitter();
    }
    if (store.packetsLost !== stats.getPacketsLost()) {
      store.packetsLost = stats.getPacketsLost();
    }

    store.publishStats = stats.getPublishStats();
    store.subscribeStats = stats.getSubscribeStats();
    const newTrackStats: Record<HMSTrackID, Partial<RTCStats>> = {};
    mergeNewTrackStatsInDraft(tracks, store.trackStats, newTrackStats);
  });
};

const storePeerConnections = (sdk: HMSSdk, store: IHMSWebrtcInternalsStore) => {
  store.setState(store => {
    store.publishConnection = sdk.getWebrtcInternals()?.getPublishPeerConnection();
    store.subscribeConnection = sdk.getWebrtcInternals()?.getSubscribePeerConnection();
  });
};
