import { IStore } from './store';
import { HMSPeerListIteratorOptions } from '../interfaces/peer-list-iterator';
import { createRemotePeer } from '../notification-manager/managers/utils';
import { PeersIterationResponse } from '../signal/interfaces';
import ITransport from '../transport/ITransport';

export class HMSPeerListIterator {
  private isEnd = false;
  private iteratorID: string | null = null;
  private DEFAULT_LIMIT = 10;
  constructor(private transport: ITransport, private store: IStore, private options?: HMSPeerListIteratorOptions) {}

  hasNext(): boolean {
    return this.isEnd;
  }

  async next() {
    let response: PeersIterationResponse;
    if (!this.iteratorID) {
      response = await this.transport.findPeer({
        ...(this.options || {}),
        limit: this.options?.limit || this.DEFAULT_LIMIT,
      });
      this.isEnd = response.eof;
      this.iteratorID = response.iterator;
    } else {
      response = await this.transport.peerIterNext({
        iterator: this.iteratorID,
        limit: this.options?.limit || this.DEFAULT_LIMIT,
      });
    }
    response.peers.forEach(peer => {
      const hmsPeer = createRemotePeer(peer, this.store);
      this.store.addPeer(hmsPeer);
    });
  }
}
