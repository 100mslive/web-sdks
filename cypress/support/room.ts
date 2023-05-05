import { CypressPeer } from './peer';

export class CypressRoom {
  private peers: CypressPeer[];

  constructor(...peers: CypressPeer[]) {
    this.peers = peers;
  }

  joinAll = async () => {
    let promises = [];
    this.peers.forEach(peer => {
      promises.push(peer.join());
    });
    await Promise.all(promises);
    promises = [];
    for (const peer1 of this.peers) {
      for (const peer2 of this.peers) {
        if (peer1 !== peer2) {
          promises.push(peer1.waitForTracks(peer2.id));
        }
      }
    }
    await Promise.all(promises);
  };

  leaveAll = async () => {
    const promises = [];
    this.peers.forEach(peer => promises.push(peer.leave()));
    await Promise.all(promises);
  };
}
