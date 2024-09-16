import { createSelector } from 'reselect';
import { byIDCurry } from './common';
import {
  selectFullAppData,
  selectHMSMessages,
  selectLocalPeerID,
  selectLocalPeerRole,
  selectMessagesMap,
  selectPeers,
  selectPeersMap,
  selectPollsMap,
  selectTracksMap,
} from './selectors';
import {
  getScreenSharesByPeer,
  isAudio,
  isAudioPlaylist,
  isTrackEnabled,
  isVideo,
  isVideoPlaylist,
} from './selectorUtils';
import { HMSLogger } from '../common/ui-logger';
import { HMSTranscriptionMode } from '../internal';
import {
  HMSAudioTrack,
  HMSGenericTypes,
  HMSPeer,
  HMSPeerID,
  HMSRoleName,
  HMSScreenVideoTrack,
  HMSStore,
  HMSTrack,
  HMSTrackID,
  HMSVideoTrack,
} from '../schema';

const selectPeerID = (_store: HMSStore, peerID: HMSPeerID | undefined) => peerID;
const selectTrackID = (_store: HMSStore, trackID: HMSTrackID | undefined) => trackID;
const selectRoleName = (_store: HMSStore, roleName: HMSRoleName | undefined) => roleName;
const selectAppDataKey = (_store: HMSStore, key: string | undefined) => key;
const selectPollID = (_store: HMSStore, pollID: string | undefined) => pollID;

const selectPeerByIDBare = createSelector([selectPeersMap, selectPeerID], (storePeers, peerID) =>
  peerID ? storePeers[peerID] : null,
);

const selectTrackByIDBare = createSelector([selectTracksMap, selectTrackID], (storeTracks, trackID) =>
  trackID ? storeTracks[trackID] : null,
);

const selectVideoTrackByIDBare = createSelector([selectTracksMap, selectTrackID], (storeTracks, trackID) => {
  if (!trackID) {
    return null;
  }
  const track = storeTracks[trackID] as HMSVideoTrack | undefined;
  if (track?.type === 'video') {
    return track;
  }
  return null;
});

const selectAudioTrackByIDBare = createSelector([selectTracksMap, selectTrackID], (storeTracks, trackID) => {
  if (!trackID) {
    return null;
  }
  const track = storeTracks[trackID] as HMSAudioTrack | undefined;
  if (track?.type === 'audio') {
    return track;
  }
  return null;
});

const selectScreenAudioTrackByIDBare = createSelector([selectTracksMap, selectTrackID], (storeTracks, trackID) => {
  if (!trackID) {
    return null;
  }
  const track = storeTracks[trackID] as HMSAudioTrack | undefined;
  if (track?.type === 'audio' && track?.source === 'screen') {
    return track;
  }
  return null;
});
const selectScreenVideoTrackByIDBare = createSelector([selectTracksMap, selectTrackID], (storeTracks, trackID) => {
  if (!trackID) {
    return null;
  }
  const track = storeTracks[trackID] as HMSScreenVideoTrack | undefined;
  if (track?.type === 'video' && track?.source === 'screen') {
    return track;
  }
  return null;
});

const selectPollByIDBare = createSelector([selectPollsMap, selectPollID], (storePolls, pollID) =>
  pollID ? storePolls[pollID] : null,
);

/**
 * Select the {@link HMSPeer} object given a peer ID.
 */
export const selectPeerByID = byIDCurry(selectPeerByIDBare);

/**
 * Select a particular key from ui app data by passed in key.
 * if key is not passed, full data is returned.
 */
export const selectAppData = byIDCurry(
  createSelector([selectFullAppData, selectAppDataKey], (appData, key) => {
    if (!appData) {
      return undefined;
    }
    if (key) {
      return appData[key];
    }
    return appData;
  }),
);

/**
 * Select a particular key from session store by passed in key.
 * if key is not passed, full data is returned.
 */
export function selectSessionStore<T extends HMSGenericTypes = { sessionStore: Record<string, any> }>(): (
  store: HMSStore<T>,
) => T['sessionStore'] | undefined;
export function selectSessionStore<
  T extends HMSGenericTypes = { sessionStore: Record<string, any> },
  K extends keyof T['sessionStore'] = keyof T['sessionStore'],
>(key: K): (store: HMSStore<T>) => T['sessionStore'][K] | undefined;
export function selectSessionStore<
  T extends HMSGenericTypes = { sessionStore: Record<string, any> },
  K extends keyof T['sessionStore'] = keyof T['sessionStore'],
>(key?: K) {
  return (store: HMSStore<T>) => {
    if (!store.sessionStore) {
      return undefined;
    }
    if (key) {
      return store.sessionStore[key];
    }
    return store.sessionStore;
  };
}

export const selectAppDataByPath = (...keys: string[]) =>
  createSelector([selectFullAppData], appData => {
    if (!appData) {
      return undefined;
    }
    if (keys && keys.length > 0) {
      let value = appData;
      for (const key of keys) {
        if (!key) {
          return value;
        }
        value = value?.[key];
      }
      return value;
    }
    return appData;
  });

/**
 * Select the name of a {@link HMSPeer} given a peer ID.
 */
export const selectPeerNameByID = byIDCurry(createSelector(selectPeerByIDBare, peer => peer?.name));

export const selectPeerTypeByID = byIDCurry(createSelector(selectPeerByIDBare, peer => peer?.type));

/**
 * Select the {@link HMSTrack} object given a track ID.
 */
export const selectTrackByID = byIDCurry(selectTrackByIDBare);

/**
 * Select the {@link HMSVideoTrack} object given a track ID.
 */
export const selectVideoTrackByID = byIDCurry(selectVideoTrackByIDBare);

/**
 * Select the {@link HMSAudioTrack} object given a track ID.
 */
export const selectAudioTrackByID = byIDCurry(selectAudioTrackByIDBare);

/**
 * Select the {@link HMSScreenAudioTrack} object given a track ID.
 */
export const selectScreenAudioTrackByID = byIDCurry(selectScreenAudioTrackByIDBare);

/**
 * Select the {@link HMSScreenVideoTrack} object given a track ID.
 */
export const selectScreenVideoTrackByID = byIDCurry(selectScreenVideoTrackByIDBare);

/**
 * Select the primary video track of a peer given a peer ID.
 */
export const selectVideoTrackByPeerID = byIDCurry((store: HMSStore, peerID?: HMSPeerID): HMSVideoTrack | undefined => {
  const peer = selectPeerByIDBare(store, peerID);
  if (peer && peer.videoTrack && peer.videoTrack !== '') {
    return store.tracks[peer.videoTrack] as HMSVideoTrack;
  }
  return undefined;
});

/**
 * Select the primary audio track of a peer given a peer ID.
 */
export const selectAudioTrackByPeerID = byIDCurry((store: HMSStore, peerID?: HMSPeerID): HMSAudioTrack | undefined => {
  const peer = selectPeerByIDBare(store, peerID);
  if (peer && peer.audioTrack && peer.audioTrack !== '') {
    return store.tracks[peer.audioTrack] as HMSAudioTrack;
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
export const selectAuxiliaryTracksByPeerID = byIDCurry((store: HMSStore, peerID?: HMSPeerID): HMSTrack[] => {
  const peer = selectPeerByIDBare(store, peerID);
  return peer?.auxiliaryTracks.map(trackID => store.tracks[trackID]) || [];
});

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

export const selectConnectionQualityByPeerID = byIDCurry((store: HMSStore, peerID: HMSPeerID | undefined) => {
  if (peerID) {
    return store.connectionQualities[peerID];
  }
  return undefined;
});

/**
 * Select the first auxiliary audio track of a peer given a peer ID.
 */
export const selectAuxiliaryAudioByPeerID = byIDCurry((store: HMSStore, peerID?: HMSPeerID) => {
  const peer = selectPeerByIDBare(store, peerID);
  if (peer) {
    const trackID = peer?.auxiliaryTracks.find(trackID => isAudio(store.tracks[trackID]));
    return trackID ? (store.tracks[trackID] as HMSAudioTrack) : undefined;
  }
  return undefined;
});

export const selectVideoPlaylistVideoTrackByPeerID = byIDCurry(
  createSelector(selectTracksMap, selectPeerByIDBare, (tracks, peer) => {
    const trackID = peer?.auxiliaryTracks.find(trackID => {
      const track = tracks[trackID];
      return isVideoPlaylist(track) && isVideo(track);
    });
    return trackID ? (tracks[trackID] as HMSVideoTrack) : undefined;
  }),
);

export const selectVideoPlaylistAudioTrackByPeerID = byIDCurry(
  createSelector(selectTracksMap, selectPeerByIDBare, (tracks, peer) => {
    const trackID = peer?.auxiliaryTracks.find(trackID => {
      const track = tracks[trackID];
      return isVideoPlaylist(track) && isAudio(track);
    });
    return trackID ? (tracks[trackID] as HMSAudioTrack) : undefined;
  }),
);

export const selectAudioPlaylistTrackByPeerID = byIDCurry(
  createSelector(selectTracksMap, selectPeerByIDBare, (tracks, peer) => {
    const trackID = peer?.auxiliaryTracks.find(trackID => {
      const track = tracks[trackID];
      return isAudioPlaylist(track) && isAudio(track);
    });
    return trackID ? (tracks[trackID] as HMSAudioTrack) : undefined;
  }),
);

export const selectScreenSharesByPeerId = byIDCurry(
  createSelector(selectTracksMap, selectPeerByIDBare, (tracks, peer) => {
    return getScreenSharesByPeer(tracks, peer);
  }),
);

/**
 * Select the screen share video track of a peer given a peer ID.
 */
export const selectScreenShareByPeerID = (id?: string) =>
  createSelector(selectScreenSharesByPeerId(id), screenshare => {
    return screenshare.video;
  });

/**
 * Select the screen share audio track of a peer given a peer ID.
 */
export const selectScreenShareAudioByPeerID = (id?: string) =>
  createSelector(selectScreenSharesByPeerId(id), screenshare => {
    return screenshare.audio;
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
    return (store.tracks[trackID] as HMSAudioTrack).volume === 0;
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
export const selectIsScreenShareLocallyMutedByPeerID = byIDCurry((store: HMSStore, peerID?: string) => {
  const track = selectScreenShareAudioByPeerID(peerID)(store);
  return selectIsAudioLocallyMuted(track?.id)(store);
});

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
export const selectScreenshareAudioVolumeByPeerID = byIDCurry((store: HMSStore, peerID?: string) => {
  const track = selectScreenShareAudioByPeerID(peerID)(store);
  return selectAudioTrackVolume(track?.id)(store);
});

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
      if (message.sender && ![localPeerID, peerID].includes(message.sender)) {
        return false;
      }
      // at this point we know the sender is one of local or passed in peer, check the recipient side
      return [localPeerID, peerID].includes(message.recipientPeer!);
    });
  },
);

const selectMessagesByRoleInternal = createSelector([selectHMSMessages, selectRoleName], (messages, roleName) => {
  if (!roleName) {
    return undefined;
  }
  return messages.filter(message => {
    // Not Role message - Broadcast message or Private Peer message
    if (!message.recipientRoles?.length) {
      return false;
    }
    return message.recipientRoles?.includes(roleName);
  });
});

export const selectBroadcastMessages = createSelector(selectHMSMessages, messages => {
  return messages.filter(message => {
    return !message.recipientPeer && !message.recipientRoles?.length;
  });
});

const selectUnreadMessageCountByRole = createSelector([selectMessagesByRoleInternal, selectRoleName], messages => {
  if (!messages) {
    return 0;
  }
  return messages.filter(m => !m.read).length;
});

const selectUnreadMessageCountByPeerID = createSelector([selectMessagesByPeerIDInternal, selectPeerID], messages => {
  if (!messages) {
    return 0;
  }
  return messages.filter(m => !m.read).length;
});

export const selectBroadcastMessagesUnreadCount = createSelector(selectBroadcastMessages, messages => {
  return messages.filter(m => !m.read).length;
});

export const selectMessagesByPeerID = byIDCurry(selectMessagesByPeerIDInternal);

export const selectMessagesByRole = byIDCurry(selectMessagesByRoleInternal);

export const selectMessagesUnreadCountByRole = byIDCurry(selectUnreadMessageCountByRole);
export const selectMessagesUnreadCountByPeerID = byIDCurry(selectUnreadMessageCountByPeerID);

/**
 * Select an array of peers of a particular role
 * @param role HMSRoleName
 * @returns HMSPeer[]
 */
export const selectPeersByRole = (role: HMSRoleName) =>
  createSelector([selectPeers], peers => {
    return peers.filter(p => p.roleName === role);
  });

/**
 * Select an array of peers of a particular role
 * @param roles HMSRoleName[]
 * @returns HMSPeer[]
 */
export const selectPeersByRoles = (roles: HMSRoleName[]) =>
  createSelector([selectPeers], (peers: HMSPeer[]) => {
    return peers.filter((peer: HMSPeer) => {
      return peer.roleName ? roles.includes(peer.roleName) : false;
    });
  });
/**
 * Selects the peer metadata for the passed in peer and returns it as JSON. If metadata is not present
 * or conversion to JSON gives an error, an empty object is returned.
 * Please directly use peer.metadata in case the metadata is not JSON by design.
 */
export const selectPeerMetadata = (peerId: HMSPeerID) =>
  createSelector(selectPeerByID(peerId), peer => {
    try {
      return peer?.metadata && peer.metadata !== '' ? JSON.parse(peer.metadata) : {};
    } catch (error) {
      console.error('cannot parse peer metadata', error);
      return {};
    }
  });

export const selectHasPeerHandRaised = (peerId: HMSPeerID) =>
  createSelector(selectPeerByID(peerId), peer => {
    return !!peer?.isHandRaised;
  });

export const selectPeerName = (peerId: HMSPeerID) => createSelector(selectPeerByID(peerId), peer => peer?.name);

export const selectPollByID = byIDCurry(selectPollByIDBare);

export const selectMessageByMessageID = (id: string) =>
  createSelector(selectMessagesMap, messages => {
    return messages[id];
  });

export const selectIsTranscriptionAllowedByMode = (mode: HMSTranscriptionMode) =>
  createSelector(selectLocalPeerRole, role => {
    if (!role?.permissions.transcriptions) {
      return false;
    }
    // only one admin permission
    return role.permissions.transcriptions[mode].length > 0;
  });
