import { useMemo } from 'react';
import { HMSPeer } from '@100mslive/react-sdk';
import { useRoomLayout } from '../../provider/roomLayoutProvider';
// @ts-ignore: No implicit Any
import { usePinnedTrack } from '../../components/AppData/useUISettings';

export const usePeerPartition = (peers: HMSPeer[]) => {
  const layout = useRoomLayout();
  const { prominent_roles, enable_local_tile_inset } =
    //@ts-ignore
    layout?.screens?.conferencing?.default?.elements?.video_tile_layout?.grid || {};
  const pinnedTrack = usePinnedTrack();

  const [prominentPeers, secondaryPeers] = useMemo(() => {
    return peers.reduce<[HMSPeer[], HMSPeer[]]>(
      (acc, peer) => {
        if (pinnedTrack) {
          if (pinnedTrack.peerId === peer.id) {
            acc[0].push(peer);
          } else {
            acc[1].push(peer);
          }
          return acc;
        }
        if (peer.isLocal && enable_local_tile_inset) {
          return acc;
        }
        if (prominent_roles?.includes(peer.roleName)) {
          acc[0].push(peer);
        } else {
          acc[1].push(peer);
        }
        return acc;
      },
      [[], []],
    );
  }, [peers, enable_local_tile_inset, prominent_roles, pinnedTrack]);

  return {
    prominentPeers,
    secondaryPeers,
    isInsetEnabled: enable_local_tile_inset,
  };
};
