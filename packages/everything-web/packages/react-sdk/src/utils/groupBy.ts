import { HMSPeer } from "@100mslive/hms-video-store";

export const groupBy = (peers: HMSPeer[]) => {
  const res: Array<[string, HMSPeer[]]> = [];
  const roleMap: Record<string, HMSPeer[]> = {};
  for (const peer of peers) {
    if (peer.roleName) {
      if (!roleMap[peer.roleName]) {
        roleMap[peer.roleName] = [];
      }
      roleMap[peer.roleName].push(peer);
    }
  }
  for (const role in roleMap) {
    if (roleMap[role].length) {
      res.push([role, roleMap[role]]);
    }
  }
  return res;
};