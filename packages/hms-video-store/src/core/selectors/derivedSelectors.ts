import { HMSPeer } from '../schema';
import { selectPeersMap, selectTracksMap } from './selectors';
import { createSelector } from 'reselect';

export interface HMSPeerWithMuteStatus {
  peer: HMSPeer;
  isAudioEnabled?: boolean;
}

export const selectPeersWithAudioStatus = createSelector(
  [selectPeersMap, selectTracksMap],
  (peersMap, tracksMap) => {
    const participants: HMSPeerWithMuteStatus[] = Object.values(peersMap).map(peer => {
      return {
        peer: peer,
        isAudioEnabled: peer.audioTrack ? tracksMap[peer.audioTrack]?.enabled : false,
      };
    });
    return participants;
  },
);
