import { HMSSdk, HMSWebrtcStats } from '@100mslive/hms-video';
import { selectPeerNameByID, selectRoomState, selectTracksMap } from '../selectors';
import { IHMSStore, IHMSInternalsStore } from '../IHMSStore';
import { HMSRoomState, HMSTrack, HMSTrackID } from '../schema';
import { mergeNewTrackStatsInDraft } from './sdkUtils/storeMergeUtils';
import { SDKToHMS } from './adapter';

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
    const newTrackStats: Record<HMSTrackID, RTCStats> = {};
    const trackIDs = Object.keys(tracks);

    for (const trackID of trackIDs) {
      newTrackStats[trackID] = Object.assign({}, stats.getTrackStats(trackID), {
        peerID: tracks[trackID].peerId,
        peerName: hmsStore.getState(selectPeerNameByID(tracks[trackID].peerId)),
      });
    }

    mergeNewTrackStatsInDraft(tracks, store.trackStats, newTrackStats);
  }, 'webrtc-stats');
};

// const storePeerConnections = (sdk: HMSSdk, store: IHMSInternalsStore) => {
//   store.namedSetState(store => {
//     store.publishConnection = sdk.getWebrtcInternals()?.getPublishPeerConnection();
//     store.subscribeConnection = sdk.getWebrtcInternals()?.getSubscribePeerConnection();
//   }, 'peer-connections');
// };
