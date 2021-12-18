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
} from '~core';
import { subscribeToSdkWebrtcStats } from './webrtc-internals-store';

export class HMSWebrtcInternals implements HMSInternalsStoreWrapper {
  readonly getState: GetState<HMSInternalsStore>;
  readonly subscribe: Subscribe<HMSInternalsStore>;
  readonly getPublishPeerConnection: () => RTCPeerConnection | undefined;
  readonly getSubscribePeerConnection: () => RTCPeerConnection | undefined;
  private readonly store: IHMSInternalsStore;

  constructor(private sdk: HMSSdk, private hmsStore: IHMSStore) {
    console.log('Init HMSWebrtcInternals');
    this.store = HMSReactiveStore.createNewHMSStore<HMSInternalsStore>(
      'HMSInternalsStore',
      createDefaultInternalsStore,
    );

    this.getState = this.store.getState;
    this.subscribe = this.store.subscribe;

    this.getPublishPeerConnection = this.sdk.getWebrtcInternals()?.getPublishPeerConnection || (() => undefined);
    this.getSubscribePeerConnection = this.sdk.getWebrtcInternals()?.getSubscribePeerConnection || (() => undefined);

    subscribeToSdkWebrtcStats(this.sdk, this.store, this.hmsStore);
  }
}
