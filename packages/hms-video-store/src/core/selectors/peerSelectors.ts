import { HMSPeer, HMSPeerID, HMSRoom, HMSStore } from '../schema';
import { createSelector } from 'reselect';

const selectRoom = (store: HMSStore): HMSRoom => store.room;
export const selectPeersMap = (store: HMSStore): Record<HMSPeerID, HMSPeer> => store.peers;
const selectPeerID = (_store: HMSStore, peerID: HMSPeerID | undefined) => peerID;

export const selectLocalMediaSettings = (store: HMSStore) => store.settings;
export const selectMaxTilesCount = createSelector(
  selectLocalMediaSettings,
  settings => settings.maxTileCount,
);

const selectSpeakers = (store: HMSStore) => {
  return store.speakers;
};

const selectSpeakerByID = (store: HMSStore, peerID: HMSPeerID | undefined) => {
  return peerID ? store.speakers[peerID] : null;
};

export const selectIsConnectedToRoom = createSelector(
  [selectRoom],
  room => room && room.isConnected,
);

export const selectPeers = createSelector([selectRoom, selectPeersMap], (room, storePeers) => {
  return room.peers.map(peerID => storePeers[peerID]);
});

export const selectLocalPeer = createSelector(selectPeers, peers => {
  return peers.filter(p => p.isLocal)[0];
});

export const selectLocalPeerID = createSelector(selectLocalPeer, peer => {
  return peer.id;
});

export const selectRemotePeers = createSelector(selectPeers, peers => {
  return peers.filter(p => !p.isLocal);
});

export const selectDominantSpeakerName = createSelector(
  selectPeersMap,
  selectSpeakers,
  (peersMap, speakers) => {
    // sort in descending order by audio level
    const speakersInOrder = Object.entries(speakers).sort((s1, s2) => {
      const s1Level = s1[1]?.audioLevel || 0;
      const s2Level = s2[1]?.audioLevel || 0;
      return s2Level > s1Level ? 1 : -1;
    });
    if (
      speakersInOrder.length > 0 &&
      speakersInOrder[0][1].audioLevel &&
      speakersInOrder[0][1].audioLevel > 0
    ) {
      const peerID = speakersInOrder[0][0];
      if (peerID in peersMap) {
        return peersMap[peerID].name;
      }
    }
    return null;
  },
);

export const selectPeerByID = createSelector([selectPeersMap, selectPeerID], (storePeers, peerID) =>
  peerID ? storePeers[peerID] : null,
);

export const selectPeerNameByID = createSelector(selectPeerByID, peer => peer?.name);

export const selectPeerAudioByID = createSelector(
  selectSpeakerByID,
  speaker => speaker?.audioLevel || 0,
);
