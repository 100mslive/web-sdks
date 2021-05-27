import { HMSPeer } from '../schema';
import { selectPeersMap } from './peerSelectors';
import { createSelector } from 'reselect';
import { selectTracksMap } from './trackSelectors';

export interface HMSPeerWithMuteStatus {
  peer: HMSPeer;
  isAudioEnabled?: boolean;
}

export const selectPeersWithAudioStatus = createSelector(
  [selectPeersMap, selectTracksMap],
  (peersMap, tracksMap) => {
    const participants: HMSPeerWithMuteStatus[] = Object.values(peersMap).map(
      peer => {
        return {
          peer: peer,
          isAudioEnabled: peer.audioTrack
            ? tracksMap[peer.audioTrack]?.enabled
            : false,
        };
      },
    );
    return participants;
  },
);
