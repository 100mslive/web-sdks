import { CypressPeer } from './peer';

export class CypressRoom {
  private peers: CypressPeer[];

  constructor(...peers: CypressPeer[]) {
    this.peers = peers;
  }

  joinAll = async () => {
    const promises = [];
    this.peers.forEach(peer => {
      promises.push(peer.join());
    });
    await Promise.all(promises);
  };

  leaveAll = async () => {
    const promises = [];
    this.peers.forEach(peer => promises.push(peer.leave()));
    await Promise.all(promises);
  };
}
