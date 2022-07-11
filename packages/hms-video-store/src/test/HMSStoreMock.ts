import { isBrowser } from '@100mslive/hms-video';
import { HMSReactiveStore } from '../core/hmsSDKStore/HMSReactiveStore';
import { HMSPeer, HMSStore } from '../core/schema';
import { HMSLogger } from '../common/ui-logger';
import { NamedSetState } from '../core/hmsSDKStore/internalTypes';

export interface HMSStoreMockPeerConfig {
  roleName?: string;
  ratePerSecond?: number;
}

export class HMSStoreMock {
  private TAG = 'MockStore';
  private readonly setState: NamedSetState<HMSStore>;
  private peerCounter = 0;

  constructor(storeSDK?: HMSReactiveStore) {
    if (!storeSDK && isBrowser && window?.__hms) {
      storeSDK = window.__hms;
    }
    // @ts-ignore
    this.setState = storeSDK!.getActions().setState;
  }

  /**
   * add lots of peers in one go, good for getting to a number quickly
   */
  addPeersBatched(count: number, config?: HMSStoreMockPeerConfig) {
    const start = performance.now();
    this._addPeersInternal(count, config);
    const timeDiff = performance.now() - start;
    HMSLogger.i(this.TAG, `Time taken in adding ${count} batched mock peers = ${timeDiff}ms`);
  }

  /**
   * add lots of peers one at a time, simulates the real world scenario better
   */
  addPeersSequentially(count: number, config?: HMSStoreMockPeerConfig) {
    // add one by one
    const start = performance.now();
    while (count--) {
      this._addPeersInternal(1, config);
    }
    const timeDiff = performance.now() - start;
    HMSLogger.i(
      this.TAG,
      `Time taken in adding ${count} sequential mock peers = ${timeDiff}ms, avg = ${timeDiff / count}ms`,
    );
  }

  /**
   * TODO: simulate with calling onPeerUpdate, should this be on sdk level? would simulate everything even better
   */
  private _addPeersInternal(count: number, config?: HMSStoreMockPeerConfig) {
    const roleName = config?.roleName || 'host';
    const peerBlueprint: HMSPeer = { auxiliaryTracks: [], id: '', isLocal: false, name: '', roleName };
    this.setState(store => {
      while (count--) {
        const peer = {
          ...peerBlueprint,
          id: this.peerCounter.toString(),
          name: `peer${this.peerCounter}`,
        };
        this.peerCounter++;
        store.room.peers.push(peer.id);
        store.peers[peer.id] = peer;
      }
    }, `add ${count} mock peers`);
  }
}
