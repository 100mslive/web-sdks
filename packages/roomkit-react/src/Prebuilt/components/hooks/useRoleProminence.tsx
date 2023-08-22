import { useMemo } from 'react';
import { HMSPeer } from '@100mslive/react-sdk';
import { useRoomLayout } from '../../provider/roomLayoutProvider';

export const useRoleProminence = (peers: HMSPeer[]) => {
  const layout = useRoomLayout();
  const { prominent_roles = [], enable_local_tile_inset = true } =
    //@ts-ignore
    layout?.screens?.conferencing?.default?.elements?.video_tile_layout?.grid || {};

  const [prominentPeers, secondaryPeers] = useMemo(() => {
    return peers.reduce<[HMSPeer[], HMSPeer[]]>(
      (acc, peer) => {
        if (peer.isLocal && enable_local_tile_inset) {
          return acc;
        }
        if (prominent_roles.includes(peer.roleName)) {
          acc[0].push(peer);
        } else {
          acc[1].push(peer);
        }
        return acc;
      },
      [[], []],
    );
  }, [peers, enable_local_tile_inset, prominent_roles]);

  return {
    prominentPeers,
    secondaryPeers,
    isInsetEnabled: enable_local_tile_inset,
  };
};
