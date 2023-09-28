import { useRef, useState } from 'react';
import { HMSPeer, HMSPeerListIteratorOptions } from '@100mslive/hms-video-store';
import { useHMSActions } from '../primitives/HmsRoomProvider';

export interface usePaginatedParticipantsResult {
  /**
   * call this function to load initial peers and also when you want to poll the peers information
   */
  loadPeers: Promise<void>;
  /**
   * this function is to be called when loadPeers is called atleast once. This will fetch the next batch of peers
   */
  loadMorePeers: Promise<void>;
  // list of peers loaded
  peers: HMSPeer[];
  // total number of peers matching the input options at the time of the request
  total: number;
}

export type usePaginatedParticipantsInput = HMSPeerListIteratorOptions;

export const usePaginatedParticipants = (options: HMSPeerListIteratorOptions) => {
  const actions = useHMSActions();
  const iterator = useRef(actions.getPeerListIterator(options));
  const [peers, setPeers] = useState<Record<string, HMSPeer>>({});
  const [total, setTotal] = useState(0);

  return {
    loadPeers: () =>
      iterator.current.findPeers.call(iterator.current).then(peers => {
        setPeers(
          peers.reduce<Record<string, HMSPeer>>((acc, peer) => {
            acc[peer.id] = peer;
            return acc;
          }, {}),
        );
        setTotal(iterator.current.getTotal());
      }),
    loadMorePeers: () =>
      iterator.current.next.call(iterator.current).then(peers => {
        setPeers(prevPeers => {
          return {
            ...prevPeers,
            ...peers.reduce<Record<string, HMSPeer>>((acc, peer) => {
              acc[peer.id] = peer;
              return acc;
            }, {}),
          };
        });
        setTotal(iterator.current.getTotal());
      }),
    total,
    peers: Object.values(peers),
  };
};
