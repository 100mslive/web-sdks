import { HMSPeer } from '../schema';
import { selectPeersMap } from './peerSelectors';
import { createSelector } from 'reselect';
import { selectTracksMap } from './trackSelectors';

export interface HMSPeerWithMuteStatus {
  peer: HMSPeer;
  isAudioMuted?: boolean;
}

export const selectPeersWithMuteStatus = createSelector(
  [selectPeersMap, selectTracksMap],
  (peersMap, tracksMap) => {
    const participants: HMSPeerWithMuteStatus[] = Object.values(peersMap).map(
      peer => {
        return {
          peer: peer,
          isAudioMuted: peer.audioTrack
            ? tracksMap[peer.audioTrack]?.enabled
            : true,
        };
      },
    );
    return participants;
  },
);
