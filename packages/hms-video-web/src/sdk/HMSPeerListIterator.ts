import { HMSRemotePeer } from './models/peer';
import { IStore } from './store';
import { HMSPeerListIteratorOptions } from '../interfaces/peer-list-iterator';
import { createRemotePeer } from '../notification-manager/managers/utils';
import { PeersIterationResponse } from '../signal/interfaces';
import ITransport from '../transport/ITransport';

export class HMSPeerListIterator {
  private isEnd = false;
  private isBeginning = true;
  private nextIterator: string | null = null;
  private prevIterator: string | null = null;
  private total = 0;
  private DEFAULT_LIMIT = 10;
  constructor(private transport: ITransport, private store: IStore, private options?: HMSPeerListIteratorOptions) {}

  hasNext(): boolean {
    return !this.isEnd;
  }

  hasPrevious(): boolean {
    return !this.isBeginning;
  }

  getTotal(): number {
    return this.total;
  }

  async next() {
    let response: PeersIterationResponse;
    if (!this.nextIterator) {
      response = await this.transport.findPeer({
        ...(this.options || {}),
        limit: this.options?.limit || this.DEFAULT_LIMIT,
      });
    } else {
      response = await this.transport.peerIterNext({
        iterator: this.nextIterator,
        limit: this.options?.limit || this.DEFAULT_LIMIT,
      });
    }
    this.isEnd = response.eof;
    this.total = response.total;
    this.nextIterator = response.iterator;
    const hmsPeers: HMSRemotePeer[] = [];
    response.peers.forEach(peer => {
      const storeHasPeer = this.store.getPeerById(peer.peer_id);
      if (!storeHasPeer) {
        const hmsPeer = createRemotePeer(peer, this.store);
        hmsPeers.push(hmsPeer);
      }
    });
    return hmsPeers;
  }

  async previous() {
    let response: PeersIterationResponse;
    if (!this.prevIterator) {
      response = await this.transport.findPeer({
        ...(this.options || {}),
        limit: this.options?.limit || this.DEFAULT_LIMIT,
      });
    } else {
      response = await this.transport.peerIterPrev({
        iterator: this.prevIterator,
        limit: this.options?.limit || this.DEFAULT_LIMIT,
      });
    }
    this.isBeginning = response.eof;
    this.prevIterator = response.iterator;
    this.total = response.total;
    const hmsPeers: HMSRemotePeer[] = [];
    response.peers.forEach(peer => {
      const storeHasPeer = this.store.getPeerById(peer.peer_id);
      if (!storeHasPeer) {
        const hmsPeer = createRemotePeer(peer, this.store);
        hmsPeers.push(hmsPeer);
      }
    });
    return hmsPeers;
  }
}
