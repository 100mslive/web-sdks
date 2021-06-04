import { HMSMessage, HMSPeer, HMSPeerID, HMSRoom, HMSStore } from '../schema';
import { createSelector } from 'reselect';
import { isScreenSharing, isTrackDisplayEnabled, isTrackEnabled } from './selectorUtils';

const selectRoom = (store: HMSStore): HMSRoom => store.room;
export const selectPeersMap = (store: HMSStore): Record<HMSPeerID, HMSPeer> => store.peers;

export const selectMessagesMap = (store: HMSStore) => store.messages.byID;
export const selectMessageIDsInOrder = (store: HMSStore) => store.messages.allIDs;

export const selectTracksMap = (store: HMSStore) => store.tracks;

export const selectLocalMediaSettings = (store: HMSStore) => store.settings;
export const selectMaxTilesCount = createSelector(
  selectLocalMediaSettings,
  settings => settings.maxTileCount,
);

const selectSpeakers = (store: HMSStore) => {
  return store.speakers;
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

export const selectLocalAudioTrackID = createSelector(selectLocalPeer, peer => peer?.audioTrack);
export const selectLocalVideoTrackID = createSelector(selectLocalPeer, peer => peer?.videoTrack);

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

export const selectIsLocalAudioEnabled = (store: HMSStore) => {
  const localPeer = selectLocalPeer(store);
  return isTrackEnabled(store, localPeer?.audioTrack);
};

export const selectIsLocalVideoEnabled = (store: HMSStore) => {
  const localPeer = selectLocalPeer(store);
  return isTrackEnabled(store, localPeer?.videoTrack);
};

export const selectIsLocalVideoDisplayEnabled = (store: HMSStore) => {
  const localPeer = selectLocalPeer(store);
  return isTrackDisplayEnabled(store, localPeer?.videoTrack);
};

export const selectIsLocalScreenShared = (store: HMSStore): boolean => {
  const localPeer = selectLocalPeer(store);
  return isScreenSharing(store, localPeer);
};

export const selectIsSomeoneScreenSharing = (store: HMSStore): boolean => {
  const peers = selectPeers(store);
  return peers.some(peer => isScreenSharing(store, peer));
};

export const selectPeerScreenSharing = (store: HMSStore): HMSPeer | undefined => {
  const peers = selectPeers(store);
  return peers.find(peer => isScreenSharing(store, peer));
};

export const selectHMSMessagesCount = createSelector(
  selectMessageIDsInOrder,
  messageIDs => messageIDs.length,
);

export const selectUnreadHMSMessagesCount = createSelector(selectMessagesMap, messages => {
  return Object.values(messages).filter(m => !m.read).length;
});

export const selectHMSMessages = createSelector(
  selectMessageIDsInOrder,
  selectMessagesMap,
  (msgIDs, msgMap) => {
    const messages: HMSMessage[] = [];
    msgIDs.forEach(msgId => {
      messages.push(msgMap[msgId]);
    });
    return messages;
  },
);
