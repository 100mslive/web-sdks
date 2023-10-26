import { HMSRemotePeer } from './models/peer';
import { IStore } from './store';
import { HMSPeerListIteratorOptions } from '../interfaces/peer-list-iterator';
import { PeerNotificationInfo } from '../notification-manager';
import { createRemotePeer } from '../notification-manager/managers/utils';
import { PeersIterationResponse } from '../signal/interfaces';
import ITransport from '../transport/ITransport';

export class HMSPeerListIterator {
  private isEnd = false;
  private iterator: string | null = null;
  private total = 0;
  private defaultPaginationLimit = 10;
  constructor(private transport: ITransport, private store: IStore, private options?: HMSPeerListIteratorOptions) {}

  private validateConnection() {
    if (!this.transport || !this.store) {
      throw Error(`Use usePaginatedParticipants or hmsActions.getPeerListIterator after preview or join has happened`);
    }
  }

  hasNext(): boolean {
    return !this.isEnd;
  }

  getTotal(): number {
    return this.total;
  }

  async findPeers() {
    this.validateConnection();
    const response = await this.transport.findPeers({
      ...(this.options || {}),
      limit: this.options?.limit || this.defaultPaginationLimit,
    });
    this.updateState(response);
    return this.processPeers(response.peers);
  }

  async next() {
    this.validateConnection();
    let response: PeersIterationResponse;
    if (!this.iterator && !this.isEnd) {
      return await this.findPeers();
    } else if (this.iterator) {
      response = await this.transport.peerIterNext({
        iterator: this.iterator,
        limit: this.options?.limit || this.defaultPaginationLimit,
      });
      this.updateState(response);
      return this.processPeers(response.peers);
    }
    return [];
  }

  private processPeers(peers: PeerNotificationInfo[]) {
    const hmsPeers: HMSRemotePeer[] = [];
    peers.forEach(peer => {
      const hmsPeer = createRemotePeer(peer, this.store);
      hmsPeers.push(hmsPeer);
    });
    return hmsPeers;
  }

  private updateState(response: PeersIterationResponse) {
    this.isEnd = response.eof;
    this.total = response.total;
    // iterator is only received once in findpeer -  reuse the same iterator
    if (response.iterator) {
      this.iterator = response.iterator;
    }
  }
}
