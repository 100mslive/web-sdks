import { HMSSdk, isBrowser } from '@100mslive/hms-video';
import { HMSReactiveStore } from '../core/hmsSDKStore/HMSReactiveStore';
import { HMSPeer, HMSStore } from '../core/schema';
import { HMSLogger } from '../common/ui-logger';
import { NamedSetState } from '../core/hmsSDKStore/internalTypes';

export interface HMSStoreMockPeerConfig {
  ratePerSecond?: number;
  joinAtSdk?: boolean;
}

export class HMSStoreMock {
  private TAG = 'MockStore';
  private readonly setState: NamedSetState<HMSStore>;
  private peerCounter = 0;
  private sdk: HMSSdk;

  constructor(storeSDK?: HMSReactiveStore) {
    if (!storeSDK && isBrowser && window?.__hms) {
      storeSDK = window.__hms;
    }
    // @ts-ignore
    this.setState = storeSDK!.getActions().setState;
    // @ts-ignore
    this.sdk = storeSDK?.getActions().sdk;
  }

  /**
   * add lots of peers in one go, good for getting to a number quickly
   */
  async addPeersBatched(count: number) {
    const start = performance.now();
    await this._addPeersInternal(count);
    const timeDiff = performance.now() - start;
    HMSLogger.i(this.TAG, `Time taken in adding ${count} batched mock peers = ${timeDiff.toFixed(2)}ms`);
  }

  /**
   * add lots of peers one at a time, simulates the real world scenario better
   */
  async addPeersSequentially(count: number, config?: HMSStoreMockPeerConfig) {
    // add one by one
    const start = performance.now();
    const peerAddPromises = [];
    const sleepTimeMs = config?.ratePerSecond ? 1000 / config.ratePerSecond : 0;
    for (let i = 0; i < count; i++) {
      if (config?.joinAtSdk) {
        this._addMockPeerInSdk();
      } else {
        peerAddPromises.push(this._addPeersInternal(1));
      }
      if (sleepTimeMs > 0) {
        await this.sleep(sleepTimeMs);
      }
    }
    await Promise.all(peerAddPromises);
    const timeDiff = performance.now() - start;
    HMSLogger.i(
      this.TAG,
      `Time taken in adding ${count} sequential mock peers = ${timeDiff.toFixed(2)}ms, avg = ${(
        timeDiff / count
      ).toFixed(2)}ms`,
    );
  }

  async sleep(timeMs: number) {
    return new Promise(resolve => setTimeout(resolve, timeMs));
  }

  /**
   * TODO: simulate with calling onPeerUpdate, should this be on sdk level? would simulate everything even better
   */
  private async _addPeersInternal(count: number) {
    if (count === 1) {
      await this.setState(this._addMockPeerInStore, 'addMockPeer');
    } else {
      await this.setState(store => {
        while (count--) {
          this._addMockPeerInStore(store);
        }
      }, `add ${count} mock peers`);
    }
  }

  private _addMockPeerInStore = (store: HMSStore) => {
    const peer: HMSPeer = {
      id: this.peerCounter.toString(),
      name: `peer${this.peerCounter}`,
      roleName: 'host',
      auxiliaryTracks: [],
      isLocal: false,
      metadata: {},
    };
    this.peerCounter++;
    store.room.peers.push(peer.id);
    store.peers[peer.id] = peer;
  };

  /**
   * add in sdk, this will keep the state synced on sdk side too
   */
  private _addMockPeerInSdk = () => {
    // @ts-ignore
    const notificationManager = this.sdk.notificationManager;
    this.peerCounter++;
    notificationManager.handleNotification({
      method: 'on-peer-join',
      params: {
        peer_id: this.peerCounter.toString(),
        info: { name: `peer${this.peerCounter}`, data: '{}', user_id: 'random' },
        role: 'host',
        tracks: {},
      },
    });
  };
}
