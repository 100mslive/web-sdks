import { HMSSdk } from '@100mslive/hms-video';
import { Subscribe } from 'zustand/vanilla';
import { storeNameWithTabTitle } from '../../common/storeName';
import { createDefaultStatsStore, HMSStatsStore, HMSReactiveStore, selectRoomState } from '..';
import { IHMSStore, IHMSStatsStore, IHMSStatsStoreReadOnly, GetState } from '../IHMSStore';
import { subscribeToSdkWebrtcStats } from './webrtc-stats-store';

/**
 * @internal
 */
export class HMSStats implements IHMSStatsStoreReadOnly {
  readonly getState: GetState<HMSStatsStore>;
  readonly subscribe: Subscribe<HMSStatsStore>;
  readonly getPublishPeerConnection: () => Promise<RTCPeerConnection | undefined>;
  readonly getSubscribePeerConnection: () => Promise<RTCPeerConnection | undefined>;
  private readonly store: IHMSStatsStore;

  constructor(private hmsStore: IHMSStore, private sdk?: HMSSdk) {
    this.store = HMSReactiveStore.createNewHMSStore<HMSStatsStore>(
      storeNameWithTabTitle('HMSStatsStore'),
      createDefaultStatsStore,
    );

    this.getState = this.store.getState;
    this.subscribe = this.store.subscribe;

    this.getPublishPeerConnection = () =>
      new Promise<RTCPeerConnection | undefined>(resolve => {
        if (this.hmsStore.getState(selectRoomState) === 'Connected') {
          resolve(this.sdk?.getWebrtcInternals()?.getPublishPeerConnection());
        } else {
          this.hmsStore.subscribe(roomState => {
            if (roomState === 'Connected') {
              resolve(this.sdk?.getWebrtcInternals()?.getPublishPeerConnection());
            }
          }, selectRoomState);
        }
      });

    this.getSubscribePeerConnection = () =>
      new Promise<RTCPeerConnection | undefined>(resolve => {
        if (this.hmsStore.getState(selectRoomState) === 'Connected') {
          resolve(this.sdk?.getWebrtcInternals()?.getSubscribePeerConnection());
        } else {
          this.hmsStore.subscribe(roomState => {
            if (roomState === 'Connected') {
              resolve(this.sdk?.getWebrtcInternals()?.getSubscribePeerConnection());
            }
          }, selectRoomState);
        }
      });

    if (!this.sdk) {
      return;
    }

    subscribeToSdkWebrtcStats(this.sdk, this.store, this.hmsStore);
  }
}
