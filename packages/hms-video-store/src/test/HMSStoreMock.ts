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
  async addPeersBatched(count: number, config?: HMSStoreMockPeerConfig) {
    const start = performance.now();
    await this._addPeersInternal(count, config);
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
    for (let i = 0; i < count; i++) {
      peerAddPromises.push(this._addPeersInternal(1, config));
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

  /**
   * TODO: simulate with calling onPeerUpdate, should this be on sdk level? would simulate everything even better
   */
  private async _addPeersInternal(count: number, config?: HMSStoreMockPeerConfig) {
    const roleName = config?.roleName || 'host';
    const peerBlueprint: HMSPeer = { auxiliaryTracks: [], id: '', isLocal: false, name: '', roleName };
    await this.setState(
      store => {
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
      },
      count === 1 ? 'addMockPeer' : `add ${count} mock peers`,
    );
  }
}
