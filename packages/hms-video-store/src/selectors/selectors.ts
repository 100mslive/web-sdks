import { createSelector } from 'reselect';
import {
  getScreenSharesByPeer,
  isAudioPlaylist,
  isDegraded,
  isTrackDisplayEnabled,
  isTrackEnabled,
  isVideo,
  isVideoPlaylist,
} from './selectorUtils';
// noinspection ES6PreferShortImport
import { HMSRole, HMSWhiteboard } from '../internal';
import {
  HMSException,
  HMSMessage,
  HMSPeer,
  HMSPeerID,
  HMSRoom,
  HMSRoomState,
  HMSStore,
  HMSVideoTrack,
} from '../schema';

/**
 * Select the current {@link HMSRoom} object to which you are connected.
 * @param store
 */
export const selectRoom = (store: HMSStore): HMSRoom => store.room;
/**
 * Select the current {@link HMSException[]} object to monitor the error logs
 * @param store
 */
export const selectErrors = (store: HMSStore): HMSException[] => store.errors;

/**
 * It will help to get the all the error
 */
export const selectRecentError = createSelector(selectErrors, errors => (errors.length === 0 ? null : errors.at(-1)));
/**
 * Select the ID of the current room to which you are connected.
 */
export const selectRoomID = createSelector(selectRoom, room => room.id);

/**
 * @internal
 */
export const selectPeersMap = (store: HMSStore): Record<HMSPeerID, HMSPeer> => store.peers;

/**
 * @internal
 */
export const selectMessagesMap = (store: HMSStore) => store.messages.byID;

/**
 * Select IDs of messages you've sent or received sorted chronologically.
 */
export const selectMessageIDsInOrder = (store: HMSStore) => store.messages.allIDs;

/**
 * @internal
 */
export const selectTracksMap = (store: HMSStore) => store.tracks;

/**
 * Select your media settings
 * i.e., choosen audio input device, audio output device and video input device.
 * @param store
 */
export const selectLocalMediaSettings = (store: HMSStore) => store.settings;

/**
 * select appData.
 * @internal
 */
export const selectFullAppData = (store: HMSStore) => store.appData;

/**
 * Select the available audio input, audio output and video input devices on your machine.
 * @param store
 * @returns An object of array of available audio input, audio output and video input devices.
 * ```
 * type DeviceMap = {
 *   audioInput: InputDeviceInfo[];
 *   audioOutput: MediaDeviceInfo[];
 *   videoInput: InputDeviceInfo[];
 * }
 * ```
 */
export const selectDevices = (store: HMSStore) => {
  return store.devices;
};

export const selectSpeakers = (store: HMSStore) => {
  return store.speakers;
};

export const selectConnectionQualities = (store: HMSStore) => {
  return store.connectionQualities;
};

/**
 * Select a boolean flag denoting whether you've joined a room.
 * NOTE: Returns true only after join, returns false during preview.
 */
export const selectIsConnectedToRoom = createSelector([selectRoom], room => room && room.isConnected);

/**
 * selectPeerCount gives the number of peers Inside the room. This doesn't count the local peer if
 * they're still in preview and haven't yet joined the room. Note that this will not necessarily equal the
 * number of peers received through selectPeers, it's possible to know total number of people in the room
 * without having details of everyone depending on dashboard settings.
 */
export const selectPeerCount = createSelector([selectIsConnectedToRoom, selectRoom], (isConnected, room) => {
  if (isConnected) {
    // if we have peer count from server return that else return number of peers in the store.
    // In case the strongly consistent peer list is disabled and only eventual consistent count and peer
    // details is sent, room.peerCount may be 0 for a few second even though local peer is connected, send 1 in that case.
    // TODO: Fix this at populating room.peerCount level than in selector.
    return room.peerCount !== undefined ? room.peerCount || 1 : room.peers.length;
  } else {
    // if we have peer count from server return that, else return number of peers except the local one because local is
    // not joined yet.
    // Math.max to ensure we're not returning -1, if the selector is called before local peer is put in the store
    return Math.max(room.peerCount !== undefined ? room.peerCount : room.peers.length - 1, 0);
  }
});

/**
 * @internal
 * Select a boolean flag denoting whether to hide local peer.
 * When this is true, `selectPeers` skips local peer.
 */
const selectHideLocalPeer = (store: HMSStore): boolean => store.hideLocalPeer;

/**
 * Select an array of peers(remote peers and your local peer) present in the room.
 */
export const selectPeers = createSelector(
  [selectRoom, selectPeersMap, selectHideLocalPeer],
  (room, storePeers, hideLocalPeer) => {
    if (hideLocalPeer) {
      return room.peers.filter(peerID => room.localPeer !== peerID).map(peerID => storePeers[peerID]);
    }
    return room.peers.map(peerID => storePeers[peerID]);
  },
);

/**
 * Select an array of tracks(remote peer tracks and your local tracks) present in the room.
 */
const selectTracks = createSelector(selectTracksMap, storeTracks => {
  return Object.values(storeTracks);
});

/**
 * Select the local peer object object assigned to you.
 */
export const selectLocalPeer = createSelector(selectRoom, selectPeersMap, (room, peers): HMSPeer | undefined => {
  return peers[room.localPeer];
});

/**
 * Select the peer ID of your local peer.
 */
export const selectLocalPeerID = createSelector(selectRoom, room => {
  return room.localPeer;
});

/**
 * Select the peer name of your local peer.
 */
export const selectLocalPeerName = createSelector(selectLocalPeer, peer => peer?.name);

/**
 * Select the role name of your local peer.
 */
export const selectLocalPeerRoleName = createSelector(selectLocalPeer, peer => peer?.roleName);

/**
 * Select the track ID of your local peer's primary audio track
 */
export const selectLocalAudioTrackID = createSelector(selectLocalPeer, peer => peer?.audioTrack);

/**
 * Select the track ID of your local peer's primary video track
 */
export const selectLocalVideoTrackID = createSelector(selectLocalPeer, peer => peer?.videoTrack);

/**
 * Select an array of track IDs of your local peer's auxiliary tracks
 */
const selectLocalAuxiliaryTrackIDs = createSelector(selectLocalPeer, peer => peer?.auxiliaryTracks);

/**
 * Select an array of track IDs of all your local peer's tracks
 */
export const selectLocalTrackIDs = createSelector(
  [selectLocalAudioTrackID, selectLocalVideoTrackID, selectLocalAuxiliaryTrackIDs],
  (audioTrackID, videoTrackID, auxiliaryTrackIDs) => {
    const trackIDs: string[] = auxiliaryTrackIDs ? [...auxiliaryTrackIDs] : [];
    audioTrackID && trackIDs.unshift(audioTrackID);
    videoTrackID && trackIDs.unshift(videoTrackID);
    return trackIDs;
  },
);

/**
 * Select remote peers(other users you're connected with via the internet) present in the room.
 */
export const selectRemotePeers = createSelector(selectPeers, peers => {
  return peers.filter(p => !p.isLocal);
});

/**
 * Select the peer who's speaking the loudest at the moment
 */
export const selectDominantSpeaker = createSelector(selectPeersMap, selectSpeakers, (peersMap, speakers) => {
  // sort in descending order by audio level
  const speakersInOrder = Object.entries(speakers).sort((s1, s2) => {
    const s1Level = s1[1]?.audioLevel || 0;
    const s2Level = s2[1]?.audioLevel || 0;
    return s2Level > s1Level ? 1 : -1;
  });
  if (speakersInOrder.length > 0 && speakersInOrder[0][1].audioLevel && speakersInOrder[0][1].audioLevel > 0) {
    const peerID = speakersInOrder[0][1].peerID;
    if (peerID in peersMap) {
      return peersMap[peerID];
    }
  }
  return null;
});

/**
 * Select a boolean denoting whether your local audio is unmuted
 * and the audio from your microphone is shared to remote peers
 */
export const selectIsLocalAudioEnabled = (store: HMSStore) => {
  const localPeer = selectLocalPeer(store);
  return isTrackEnabled(store, localPeer?.audioTrack);
};

/**
 * Select a boolean denoting whether your local video is unmuted
 * and the video from your camera is shared to remote peers
 */
export const selectIsLocalVideoEnabled = (store: HMSStore) => {
  const localPeer = selectLocalPeer(store);
  return isTrackEnabled(store, localPeer?.videoTrack);
};

/**
 * Select a boolean denoting whether you've chosen to unmute and share your local video.
 *
 * NOTE: Once you call `hmsActions.setLocalVideoEnabled(true)`to unmute your local video,
 * it takes some time to fetch your video from your video source.
 * This displayEnabled property gives immediate feedback for a more interactive UI,
 * without waiting for the video source
 */
export const selectIsLocalVideoDisplayEnabled = (store: HMSStore) => {
  const localPeer = selectLocalPeer(store);
  return isTrackDisplayEnabled(store, localPeer?.videoTrack);
};

/**
 * Select a boolean denoting whether your screen is shared to remote peers in the room.
 */
export const selectIsLocalScreenShared = createSelector(selectLocalPeer, selectTracksMap, (localPeer, tracksMap) => {
  const { video, audio } = getScreenSharesByPeer(tracksMap, localPeer);
  return !!(video || audio);
});

/**
 * Select the first peer who is currently sharing their screen.
 */
export const selectPeerScreenSharing = createSelector(selectPeersMap, selectTracksMap, (peersMap, tracksMap) => {
  let screensharePeer = undefined;
  for (const peerID in peersMap) {
    const peer = peersMap[peerID];
    const { video, audio } = getScreenSharesByPeer(tracksMap, peer);
    if (video) {
      return peer;
    } else if (audio && !screensharePeer) {
      screensharePeer = peer;
    }
  }
  return screensharePeer;
});

/**
 * Select a boolean denoting whether someone is sharing screen in the room.
 */
export const selectIsSomeoneScreenSharing = createSelector(selectPeerScreenSharing, peer => {
  return !!peer;
});

/**
 * Select the first peer who is currently sharing their audio only screen
 */
export const selectPeerSharingAudio = createSelector(selectPeersMap, selectTracksMap, (peersMap, tracksMap) => {
  for (const peerID in peersMap) {
    const peer = peersMap[peerID];
    const { audio, video } = getScreenSharesByPeer(tracksMap, peer);
    if (!video && !!audio) {
      return peer;
    }
  }
  return undefined;
});

/**
 * Select an array of peers who are currently sharing their screen.
 */
export const selectPeersScreenSharing = createSelector(selectPeersMap, selectTracksMap, (peersMap, tracksMap) => {
  const videoPeers = [];
  const audioPeers = [];
  for (const peerID in peersMap) {
    const peer = peersMap[peerID];
    const { video, audio } = getScreenSharesByPeer(tracksMap, peer);
    if (video) {
      videoPeers.push(peer);
    } else if (audio) {
      audioPeers.push(peer);
    }
  }
  return videoPeers.concat(audioPeers);
});

export const selectPeerSharingVideoPlaylist = createSelector(selectPeersMap, selectTracksMap, (peersMap, tracksMap) => {
  for (const trackId in tracksMap) {
    const track = tracksMap[trackId];
    if (isVideoPlaylist(track) && isVideo(track) && track.peerId) {
      return peersMap[track.peerId];
    }
  }
  return undefined;
});

export const selectPeerSharingAudioPlaylist = createSelector(selectPeersMap, selectTracksMap, (peersMap, tracksMap) => {
  for (const trackId in tracksMap) {
    const track = tracksMap[trackId];
    if (isAudioPlaylist(track) && track.peerId) {
      return peersMap[track.peerId];
    }
  }
  return undefined;
});

/**
 * Select an array of tracks that have been degraded(receiving lower video quality/no video) due to bad network locally.
 */
export const selectDegradedTracks = createSelector(selectTracks, tracks =>
  (tracks as HMSVideoTrack[]).filter(isDegraded),
);

/**
 * Select the number of messages(sent and received).
 */
export const selectHMSMessagesCount = createSelector(selectMessageIDsInOrder, messageIDs => messageIDs.length);

/**
 * Select the number of unread messages.
 */
export const selectUnreadHMSMessagesCount = createSelector(selectMessagesMap, messages => {
  return Object.values(messages).filter(m => !m.read).length;
});

/**
 * Select an array of messages in the room(sent and received).
 */
export const selectHMSMessages = createSelector(selectMessageIDsInOrder, selectMessagesMap, (msgIDs, msgMap) => {
  const messages: HMSMessage[] = [];
  msgIDs.forEach(msgId => {
    messages.push(msgMap[msgId]);
  });
  return messages;
});

export const selectHMSBroadcastMessages = createSelector(selectHMSMessages, messages => {
  return messages.filter(m => !m.recipientPeer && !(m.recipientRoles && m.recipientRoles?.length > 0));
});
/**
 * Select the number of unread broadcast messages
 */
export const selectUnreadHMSBroadcastMessagesCount = createSelector(selectHMSBroadcastMessages, messages => {
  return messages.filter(m => !m.read).length;
});
/**
 * Select the current state of the room.
 */
export const selectRoomState = createSelector([selectRoom], room => room && room.roomState);

/**
 * Select a boolean denoting whether the room is in Preview state.
 */
export const selectIsInPreview = createSelector(selectRoomState, roomState => roomState === HMSRoomState.Preview);

export const selectRoomStarted = createSelector(selectRoom, room => room.roomState !== HMSRoomState.Disconnected);

/**
 * Select available roles in the room as a map between the role name and {@link HMSRole} object.
 */
export const selectRolesMap = (store: HMSStore): Record<string, HMSRole> => {
  return store.roles;
};

/**
 * Select an array of names of available roles in the room.
 */
export const selectAvailableRoleNames = createSelector([selectRolesMap], rolesMap => Object.keys(rolesMap));

/**
 * Select the {@link HMSRole} object of your local peer.
 */
export const selectLocalPeerRole = createSelector([selectLocalPeer, selectRolesMap], (localPeer, rolesMap) =>
  localPeer?.roleName ? rolesMap[localPeer.roleName] : null,
);

export const selectPreviewRoleName = (store: HMSStore) => store.preview?.asRole;

/**
 * Select the {@link HMSRole} used for preview.
 *
 */
export const selectPreviewRole = createSelector([selectPreviewRoleName, selectRolesMap], (roleName, rolesMap) =>
  roleName ? rolesMap[roleName] : null,
);

/**
 * Select a boolean denoting whether if your local peer is allowed to subscribe to any other role.
 */
export const selectIsAllowedToSubscribe = createSelector([selectLocalPeerRole], (role): boolean => {
  if (!role?.subscribeParams?.subscribeToRoles) {
    return false;
  }
  return role.subscribeParams.subscribeToRoles.length > 0;
});

/**
 * Select the permissions which determine what actions the local peer can do.
 */
export const selectPermissions = createSelector(selectLocalPeerRole, role => role?.permissions);
export const selectRecordingState = createSelector(selectRoom, room => room.recording);
export const selectRTMPState = createSelector(selectRoom, room => room.rtmp);
export const selectHLSState = createSelector(selectRoom, room => room.hls);
export const selectSessionId = createSelector(selectRoom, room => room.sessionId);
export const selectRoomStartTime = createSelector(selectRoom, room => room.startedAt);
export const selectIsLargeRoom = createSelector(selectRoom, room => !!room.isLargeRoom);
export const selectIsEffectsEnabled = createSelector(selectRoom, room => !!room.isEffectsEnabled);
export const selectEffectsKey = createSelector(selectRoom, room => room.effectsKey);

export const selectTemplateAppData = (store: HMSStore) => store.templateAppData;
/** @deprecated - use `selectSessionStore` instead */
export const selectSessionMetadata = (store: HMSStore) => store.sessionMetadata;
export const selectPollsMap = (store: HMSStore) => store.polls;
export const selectPolls = (store: HMSStore) => {
  return Object.values(store.polls);
};

export const selectHandRaisedPeers = createSelector(selectPeers, peers => {
  return peers.filter(peer => peer.isHandRaised);
});

/** select a map of all the whiteboards in the session */
export const selectWhiteboards = (store: HMSStore) => store.whiteboards;
/** select the primary/first whiteboard of a session */
export const selectWhiteboard = createSelector(
  selectWhiteboards,
  whiteboards => Object.values(whiteboards)[0] as HMSWhiteboard | undefined,
);
