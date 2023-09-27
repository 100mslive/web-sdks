import { useState } from 'react';
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
  const iterator = actions.getPeerListIterator(options);
  const [peers, setPeers] = useState<HMSPeer[]>([]);
  const [total, setTotal] = useState(0);

  return {
    loadPeers: () =>
      iterator.findPeers.call(iterator).then(peers => {
        setPeers(peers);
        setTotal(iterator.getTotal());
      }),
    loadMorePeers: () =>
      iterator.next.call(iterator).then(peers => {
        setPeers(prevPeers => prevPeers.concat(peers));
        setTotal(iterator.getTotal());
      }),
    total,
    peers,
  };
};
