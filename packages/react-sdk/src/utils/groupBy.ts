import { HMSPeer } from '@100mslive/hms-video-store';
/**
 * Give array like [
 * { name: 'peer1', id: 1, roleName: 'role1' },
 * { name: 'peer2', id: 2, roleName: 'role2' }
 *]
 * the output will be
 * {
 * 'role1': [{'name': 'peer1', id: 1, roleName: 'role1'}],
 * 'role2': [{ name: 'peer2', id: 2, roleName: 'role2' }]
 * }
 * @param {HMSPeer[]} peers
 * @returns
 */
export const groupByRoles = (peers: HMSPeer[]) => {
  if (!peers || !Array.isArray(peers) || peers.length === 0) {
    return {};
  }
  return peers.reduce((res: Record<string, HMSPeer[]>, peer) => {
    if (!peer.roleName) {
      return res;
    }
    if (!res[peer.roleName]) {
      res[peer.roleName] = [];
    }
    res[peer.roleName].push(peer);
    return res;
  }, {});
};
