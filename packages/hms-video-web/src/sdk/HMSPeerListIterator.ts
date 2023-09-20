import { HMSRemotePeer } from './models/peer';
import { IStore } from './store';
import { HMSPeerUpdate, HMSUpdateListener } from '../interfaces';
import { HMSPeerListIteratorOptions } from '../interfaces/peer-list-iterator';
import { createRemotePeer } from '../notification-manager/managers/utils';
import { PeersIterationResponse } from '../signal/interfaces';
import ITransport from '../transport/ITransport';

export class HMSPeerListIterator {
  private isEnd = false;
  private iteratorID: string | null = null;
  private DEFAULT_LIMIT = 10;
  constructor(
    private transport: ITransport,
    private store: IStore,
    private listener?: HMSUpdateListener,
    private options?: HMSPeerListIteratorOptions,
  ) {}

  hasNext(): boolean {
    return !this.isEnd;
  }

  async next() {
    let response: PeersIterationResponse;
    if (!this.iteratorID) {
      response = await this.transport.findPeer({
        ...(this.options || {}),
        limit: this.options?.limit || this.DEFAULT_LIMIT,
      });
    } else {
      response = await this.transport.peerIterNext({
        iterator: this.iteratorID,
        limit: this.options?.limit || this.DEFAULT_LIMIT,
      });
    }
    this.isEnd = response.eof;
    this.iteratorID = response.iterator;
    const hmsPeers: HMSRemotePeer[] = [];
    response.peers.forEach(peer => {
      if (this.store.getLocalPeer()?.peerId === peer.peer_id) {
        return;
      }
      const storeHasPeer = this.store.getPeerById(peer.peer_id);
      if (!storeHasPeer) {
        const hmsPeer = createRemotePeer(peer, this.store);
        hmsPeers.push(hmsPeer);
        this.store.addPeer(hmsPeer);
      }
    });
    this.listener?.onPeerUpdate(HMSPeerUpdate.PEER_ITERATOR_UPDATED, hmsPeers);
  }
}
