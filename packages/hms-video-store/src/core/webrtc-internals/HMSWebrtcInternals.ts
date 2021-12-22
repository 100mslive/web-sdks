import { HMSSdk } from '@100mslive/hms-video';
import { Subscribe } from 'zustand/vanilla';
import {
  createDefaultInternalsStore,
  HMSInternalsStore,
  HMSReactiveStore,
  IHMSStore,
  IHMSInternalsStore,
  HMSInternalsStoreWrapper,
  GetState,
  selectRoomState,
} from '..';
import { subscribeToSdkWebrtcStats } from './webrtc-internals-store';

export class HMSWebrtcInternals implements HMSInternalsStoreWrapper {
  readonly getState: GetState<HMSInternalsStore>;
  readonly subscribe: Subscribe<HMSInternalsStore>;
  readonly getPublishPeerConnection: () => Promise<RTCPeerConnection | undefined>;
  readonly getSubscribePeerConnection: () => Promise<RTCPeerConnection | undefined>;
  private readonly store: IHMSInternalsStore;

  constructor(private hmsStore: IHMSStore, private sdk?: HMSSdk) {
    this.store = HMSReactiveStore.createNewHMSStore<HMSInternalsStore>(
      'HMSInternalsStore',
      createDefaultInternalsStore,
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
