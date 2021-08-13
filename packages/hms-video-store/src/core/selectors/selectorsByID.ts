import { createSelector } from 'reselect';
import { selectHMSMessages, selectLocalPeerID, selectPeersMap, selectTracksMap } from './selectors';
import { HMSPeerID, HMSRoleName, HMSStore, HMSTrack, HMSTrackID } from '../schema';
import { isAudio, isScreenShare, isScreenSharing, isTrackEnabled, isVideo } from './selectorUtils';
import { HMSLogger } from '../../common/ui-logger';

type byIDSelector<T> = (store: HMSStore, id?: string) => T;

/**
 * StoreSelector is a function that takes in {@link HMSStore} as argument
 * and returns a part of the store that is queried using the selector.
 * @typeParam T Part of the store that you wish to query.
 */
type StoreSelector<T> = (store: HMSStore) => T;

/**
 * takes in a normal selector which has store and id as input and curries it to make it easier to use.
 * Before: store.getState((store) => normalSelector(store, peerID))
 * After: store.getState(curriedSelector(peerID))
 */
function byIDCurry<T>(selector: byIDSelector<T>): (id?: string) => StoreSelector<T> {
  return (id?: string) => {
    return (store: HMSStore) => selector(store, id);
  };
}

const selectPeerID = (_store: HMSStore, peerID: HMSPeerID | undefined) => peerID;
const selectTrackID = (_store: HMSStore, trackID: HMSTrackID | undefined) => trackID;
const selectRoleName = (_store: HMSStore, roleName: HMSRoleName | undefined) => roleName;

const selectPeerByIDBare = createSelector([selectPeersMap, selectPeerID], (storePeers, peerID) =>
  peerID ? storePeers[peerID] : null,
);

const selectTrackByIDBare = createSelector(
  [selectTracksMap, selectTrackID],
  (storeTracks, trackID) => (trackID ? storeTracks[trackID] : null),
);

/**
 * Select the {@link HMSPeer} object given a peer ID.
 */
export const selectPeerByID = byIDCurry(selectPeerByIDBare);

/**
 * Select the name of a {@link HMSPeer} given a peer ID.
 */
export const selectPeerNameByID = byIDCurry(createSelector(selectPeerByIDBare, peer => peer?.name));

/**
 * Select the {@link HMSTrack} object given a track ID.
 */
export const selectTrackByID = byIDCurry(selectTrackByIDBare);

/**
 * Select the primary video track of a peer given a peer ID.
 */
export const selectVideoTrackByPeerID = byIDCurry((store: HMSStore, peerID?: HMSPeerID):
  | HMSTrack
  | undefined => {
  const peer = selectPeerByIDBare(store, peerID);
  if (peer && peer.videoTrack && peer.videoTrack !== '') {
    return store.tracks[peer.videoTrack];
  }
  return undefined;
});

/**
 * Select the primary audio track of a peer given a peer ID.
 */
export const selectAudioTrackByPeerID = byIDCurry((store: HMSStore, peerID?: HMSPeerID):
  | HMSTrack
  | undefined => {
  const peer = selectPeerByIDBare(store, peerID);
  if (peer && peer.audioTrack && peer.audioTrack !== '') {
    return store.tracks[peer.audioTrack];
  }
  return undefined;
});

/**
 * Select the camera stream of a peer given a peer ID.
 * This is the primary video track of a peer.
 */
export const selectCameraStreamByPeerID = selectVideoTrackByPeerID;

/**
 * Select an array of auxiliary tracks of a peer given a peer ID.
 */
export const selectAuxiliaryTracksByPeerID = byIDCurry(
  (store: HMSStore, peerID?: HMSPeerID): HMSTrack[] => {
    const peer = selectPeerByIDBare(store, peerID);
    return peer?.auxiliaryTracks.map(trackID => store.tracks[trackID]) || [];
  },
);

const selectSpeakerByTrackID = (store: HMSStore, trackID: HMSTrackID | undefined) => {
  return trackID ? store.speakers[trackID] : null;
};

/**
 * Select the audio level of a track given a track ID.
 */
export const selectTrackAudioByID = byIDCurry(
  createSelector(selectSpeakerByTrackID, speaker => speaker?.audioLevel || 0),
);

/**
 * Select speaker object of audioTrack of a peer given a peer ID.
 */
const selectSpeakerByPeerID = (store: HMSStore, peerID: HMSPeerID | undefined) => {
  const peerAudioTrack = selectAudioTrackByPeerID(peerID)(store);
  return selectSpeakerByTrackID(store, peerAudioTrack?.id);
};

/**
 * Select audio level of audioTrack of a peer given a peer IDß.
 */
export const selectPeerAudioByID = byIDCurry(
  createSelector(selectSpeakerByPeerID, speaker => speaker?.audioLevel || 0),
);

/**
 * Select the first auxiliary audio track of a peer given a peer ID.
 */
export const selectAuxiliaryAudioByPeerID = byIDCurry((store: HMSStore, peerID?: HMSPeerID):
  | HMSTrack
  | undefined => {
  const peer = selectPeerByIDBare(store, peerID);
  if (peer) {
    const trackID = peer?.auxiliaryTracks.find(trackID => isAudio(store.tracks[trackID]));
    return trackID ? store.tracks[trackID] : undefined;
  }
  return undefined;
});

/**
 * Select the screen share video track of a peer given a peer ID.
 */
export const selectScreenShareByPeerID = byIDCurry((store: HMSStore, peerID?: HMSPeerID):
  | HMSTrack
  | undefined => {
  const peer = selectPeerByIDBare(store, peerID);
  if (peer && isScreenSharing(store, peer)) {
    const trackID = peer?.auxiliaryTracks.find(trackId => {
      const track = store.tracks[trackId];
      return isVideo(track) && isScreenShare(track);
    });
    return trackID ? store.tracks[trackID] : undefined;
  }
  return undefined;
});

/**
 * Select the screen share audio track of a peer given a peer ID.
 */
export const selectScreenShareAudioByPeerID = byIDCurry((store: HMSStore, peerID?: HMSPeerID):
  | HMSTrack
  | undefined => {
  const peer = selectPeerByIDBare(store, peerID);
  if (peer && isScreenSharing(store, peer)) {
    const trackID = peer?.auxiliaryTracks.find(trackId => {
      const track = store.tracks[trackId];
      return isAudio(track) && isScreenShare(track);
    });
    return trackID ? store.tracks[trackID] : undefined;
  }
  return undefined;
});

/**
 * Select a boolean denoting whether a peer has unmuted audio and sharing it to other peers.
 */
export const selectIsPeerAudioEnabled = byIDCurry((store: HMSStore, peerID?: string) => {
  const peer = selectPeerByIDBare(store, peerID);
  return isTrackEnabled(store, peer?.audioTrack);
});

/**
 * Select a boolean denoting whether a peer has unmuted video and sharing it to other peers.
 */
export const selectIsPeerVideoEnabled = byIDCurry((store: HMSStore, peerID?: string) => {
  const peer = selectPeerByIDBare(store, peerID);
  return isTrackEnabled(store, peer?.videoTrack);
});

/**
 * Select a boolean denoting whether you've muted an audio track locally(only for you) given a track ID.
 */
export const selectIsAudioLocallyMuted = byIDCurry((store: HMSStore, trackID?: string) => {
  if (trackID && store.tracks[trackID]) {
    return store.tracks[trackID].volume === 0;
  }
  return undefined;
});

/**
 * Select a boolean denoting whether you've muted the primary audio track of a peer locally(only for you) given a peer ID.
 */
export const selectIsLocallyMutedByPeerID = byIDCurry((store: HMSStore, peerID?: string) => {
  const peer = selectPeerByIDBare(store, peerID);
  return selectIsAudioLocallyMuted(peer?.audioTrack)(store);
});

/**
 * Select a boolean denoting whether you've muted the screen share audio track of a peer locally(only for you) given a peer ID.
 */
export const selectIsScreenShareLocallyMutedByPeerID = byIDCurry(
  (store: HMSStore, peerID?: string) => {
    const track = selectScreenShareAudioByPeerID(peerID)(store);
    return selectIsAudioLocallyMuted(track?.id)(store);
  },
);

/**
 * Select the local audio volume of an audio track given a track ID.
 *
 * NOTE: **Volume** of a track is different from **Audio Level** of a track,
 * - Audio Level measures the audio of a track and it comes from 100ms's servers.
 * - Volume is how loud you hear the audio of a track, this is controlled by you at the client side.
 */
export const selectAudioTrackVolume = byIDCurry((store: HMSStore, trackID?: string) => {
  const track = selectTrackByIDBare(store, trackID);
  if (track) {
    if (track.type !== 'audio') {
      HMSLogger.w('Please pass audio track here');
      return undefined;
    }
    return track.volume;
  }
  return undefined;
});

/**
 * Select the local audio volume of the primary audio track of a peer given a peer ID.
 */
export const selectAudioVolumeByPeerID = byIDCurry((store: HMSStore, peerID?: string) => {
  const peer = selectPeerByIDBare(store, peerID);
  return selectAudioTrackVolume(peer?.audioTrack)(store);
});

/**
 * Select the local audio volume of the screen share of a peer given a peer ID.
 */
export const selectScreenshareAudioVolumeByPeerID = byIDCurry(
  (store: HMSStore, peerID?: string) => {
    const track = selectScreenShareAudioByPeerID(peerID)(store);
    return selectAudioTrackVolume(track?.id)(store);
  },
);

/**
 * Select the current simulcast layer of a track given a track ID.
 */
export const selectSimulcastLayerByTrack = byIDCurry((store: HMSStore, trackID?: string) => {
  const track = selectTrackByIDBare(store, trackID);
  if (track) {
    if (track.type !== 'video') {
      HMSLogger.w('Please pass video track here');
      return undefined;
    }
    return track.layer;
  }
  return undefined;
});

const selectMessagesByPeerIDInternal = createSelector(
  [selectHMSMessages, selectLocalPeerID, selectPeerID],
  (messages, localPeerID, peerID) => {
    if (!peerID) {
      return undefined;
    }
    return messages.filter(message => {
      // Broadcast message
      if (!message.recipientPeer && !message.recipientRoles?.length) {
        return false;
      }
      // if localPeer or peerID is not a sender remove this
      if (![localPeerID, peerID].includes(message.sender)) {
        return false;
      }
      // at this point we know the sender is one of local or passed in peer, check the recipient side
      return [localPeerID, peerID].includes(message.recipientPeer!);
    });
  },
);

const selectMessagesByRoleInternal = createSelector(
  [selectHMSMessages, selectRoleName],
  (messages, roleName) => {
    if (!roleName) {
      return undefined;
    }
    return messages.filter(message => {
      // Broadcast message
      if (!message.recipientPeer && !message.recipientRoles?.length) {
        return false;
      }
      const iSent = message.recipientRoles?.includes(roleName);
      const roleSent = message.senderRole === roleName;
      return iSent || roleSent;
    });
  },
);

export const selectBroadcastMessages = createSelector(selectHMSMessages, messages => {
  return messages.filter(message => {
    if (!message.recipientPeer && !message.recipientRoles?.length) {
      return true;
    }
    return false;
  });
});

const selectUnreadMessageCountByRole = createSelector(
  [selectMessagesByRoleInternal, selectRoleName],
  messages => {
    if (!messages) {
      return 0;
    }
    return messages.filter(m => !m.read).length;
  },
);

const selectUnreadMessageCountByPeerID = createSelector(
  [selectMessagesByPeerIDInternal, selectPeerID],
  messages => {
    if (!messages) {
      return 0;
    }
    return messages.filter(m => !m.read).length;
  },
);

export const selectBroadcastMessagesUnreadCount = createSelector(
  selectBroadcastMessages,
  messages => {
    return messages.filter(m => !m.read).length;
  },
);

export const selectMessagesByPeerID = byIDCurry(selectMessagesByPeerIDInternal);

export const selectMessagesByRole = byIDCurry(selectMessagesByRoleInternal);

export const selectMessagesUnreadCountByRole = byIDCurry(selectUnreadMessageCountByRole);
export const selectMessagesUnreadCountByPeerID = byIDCurry(selectUnreadMessageCountByPeerID);
