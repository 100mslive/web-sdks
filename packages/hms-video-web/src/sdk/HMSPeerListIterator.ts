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
  private DEFAULT_LIMIT = 10;
  constructor(private transport: ITransport, private store: IStore, private options?: HMSPeerListIteratorOptions) {}

  hasNext(): boolean {
    return !this.isEnd;
  }

  getTotal(): number {
    return this.total;
  }

  async findPeers() {
    const response = await this.transport.findPeers({
      ...(this.options || {}),
      limit: this.options?.limit || this.DEFAULT_LIMIT,
    });
    this.total = response.total;
    this.iterator = response.iterator;
    this.isEnd = response.eof;
    return this.processPeers(response.peers);
  }

  async next() {
    let response: PeersIterationResponse;
    if (!this.iterator) {
      response = await this.transport.findPeers({
        ...(this.options || {}),
        limit: this.options?.limit || this.DEFAULT_LIMIT,
      });
    } else {
      response = await this.transport.peerIterNext({
        iterator: this.iterator,
        limit: this.options?.limit || this.DEFAULT_LIMIT,
      });
    }
    this.isEnd = response.eof;
    this.total = response.total;
    this.iterator = response.iterator;
    return this.processPeers(response.peers);
  }

  private processPeers(peers: PeerNotificationInfo[]) {
    const hmsPeers: HMSRemotePeer[] = [];
    peers.forEach(peer => {
      const hmsPeer = createRemotePeer(peer, this.store);
      hmsPeers.push(hmsPeer);
    });
    return hmsPeers;
  }
}
