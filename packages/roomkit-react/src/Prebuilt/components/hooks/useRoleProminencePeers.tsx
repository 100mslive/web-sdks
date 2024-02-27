import { useMemo } from 'react';
import { HMSPeer } from '@100mslive/react-sdk';
// @ts-ignore: No implicit Any
import { usePinnedTrack } from '../AppData/useUISettings';

export const useRoleProminencePeers = (prominentRoles: string[], peers: HMSPeer[], isInsetEnabled: boolean) => {
  const pinnedTrack = usePinnedTrack();

  const [prominentPeers, secondaryPeers] = useMemo(() => {
    return peers.reduce<[HMSPeer[], HMSPeer[]]>(
      (acc, peer) => {
        if (pinnedTrack) {
          if (pinnedTrack.peerId === peer.id) {
            acc[0].push(peer);
          } else if (!(isInsetEnabled && peer.isLocal)) {
            acc[1].push(peer);
          }
          return acc;
        }
        if (peer.isLocal && isInsetEnabled && !prominentRoles?.includes(peer.roleName || '')) {
          return acc;
        }
        if (prominentRoles?.includes(peer.roleName || '')) {
          acc[0].push(peer);
        } else {
          acc[1].push(peer);
        }

        return acc;
      },
      [[], []],
    );
  }, [peers, isInsetEnabled, prominentRoles, pinnedTrack]);

  return {
    prominentPeers,
    secondaryPeers,
  };
};
