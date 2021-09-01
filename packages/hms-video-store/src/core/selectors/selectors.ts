import { HMSMessage, HMSPeer, HMSPeerID, HMSRoom, HMSRoomState, HMSStore } from '../schema';
import { createSelector } from 'reselect';
// noinspection ES6PreferShortImport
import { HMSRole } from '../hmsSDKStore/sdkTypes';
import {
  getScreenshareTracks,
  isDegraded,
  isScreenSharing,
  isTrackDisplayEnabled,
  isTrackEnabled,
} from './selectorUtils';

/**
 * Select the current {@link HMSRoom} object to which you are connected.
 * @param store
 */
export const selectRoom = (store: HMSStore): HMSRoom => store.room;

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

/**
 * Select a boolean flag denoting whether you've joined a room.
 * NOTE: Returns true only after join, returns false during preview.
 */
export const selectIsConnectedToRoom = createSelector(
  [selectRoom],
  room => room && room.isConnected,
);

/**
 * Select an array of peers(remote peers and your local peer) present in the room.
 */
export const selectPeers = createSelector([selectRoom, selectPeersMap], (room, storePeers) => {
  return room.peers.map(peerID => storePeers[peerID]);
});

/**
 * Select an array of tracks(remote peer tracks and your local tracks) present in the room.
 */
const selectTracks = createSelector(selectTracksMap, storeTracks => {
  return Object.values(storeTracks);
});

/**
 * Select the local peer object object assigned to you.
 */
export const selectLocalPeer = createSelector(selectPeers, peers => {
  return peers.filter(p => p.isLocal)[0];
});

/**
 * Select the peer ID of your local peer.
 */
export const selectLocalPeerID = createSelector(selectLocalPeer, peer => {
  return peer?.id;
});

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
    const trackIDs: string[] = [...auxiliaryTrackIDs];
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
export const selectDominantSpeaker = createSelector(
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
      const peerID = speakersInOrder[0][1].peerID;
      if (peerID in peersMap) {
        return peersMap[peerID];
      }
    }
    return null;
  },
);

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
export const selectIsLocalScreenShared = createSelector(
  selectLocalPeer,
  selectTracksMap,
  (localPeer, tracksMap) => {
    return isScreenSharing(tracksMap, localPeer);
  },
);

/**
 * Select the first peer who is currently sharing their screen.
 */
export const selectPeerScreenSharing = createSelector(
  selectPeersMap,
  selectTracksMap,
  (peersMap, tracksMap) => {
    for (const peerID in peersMap) {
      const peer = peersMap[peerID];
      if (isScreenSharing(tracksMap, peer)) {
        return peer;
      }
    }
    return undefined;
  },
);

/**
 * Select a boolean denoting whether someone is sharing screen in the room.
 */
export const selectIsSomeoneScreenSharing = createSelector(selectPeerScreenSharing, peer => {
  return !!peer;
});

/**
 * Select the first peer who is currently sharing their audio only screen
 */
export const selectPeerSharingAudio = createSelector(
  selectPeersMap,
  selectTracksMap,
  (peersMap, tracksMap) => {
    for (const peerID in peersMap) {
      const peer = peersMap[peerID];
      const [videoTrack, audioTrack] = getScreenshareTracks(tracksMap, peer);
      if (!videoTrack && !!audioTrack) {
        return peer;
      }
    }
    return undefined;
  },
);

/**
 * Select an array of peers who are currently sharing their screen.
 */
export const selectPeersScreenSharing = createSelector(
  selectPeersMap,
  selectTracksMap,
  (peersMap, tracksMap) => {
    const peers = [];
    for (const peerID in peersMap) {
      const peer = peersMap[peerID];
      if (isScreenSharing(tracksMap, peer)) {
        peers.push(peer);
      }
    }
    return peers;
  },
);

/**
 * Select an array of tracks that have been degraded(receiving lower video quality/no video) due to bad network locally.
 */
export const selectDegradedTracks = createSelector(selectTracks, tracks =>
  tracks.filter(isDegraded),
);

/**
 * Select the number of messages(sent and received).
 */
export const selectHMSMessagesCount = createSelector(
  selectMessageIDsInOrder,
  messageIDs => messageIDs.length,
);

/**
 * Select the number of unread messages.
 */
export const selectUnreadHMSMessagesCount = createSelector(selectMessagesMap, messages => {
  return Object.values(messages).filter(m => !m.read).length;
});

/**
 * Select an array of messages in the room(sent and received).
 */
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

/**
 * Select the current state of the room.
 */
export const selectRoomState = createSelector([selectRoom], room => room && room.roomState);

/**
 * Select a boolean denoting whether the room is in Preview state.
 */
export const selectIsInPreview = createSelector(
  selectRoomState,
  roomState => roomState === HMSRoomState.Preview,
);

export const selectRoomStarted = createSelector(
  selectRoom,
  room => room.roomState !== HMSRoomState.Disconnected,
);

/**
 * Select available roles in the room as a map between the role name and {@link HMSRole} object.
 */
export const selectRolesMap = (store: HMSStore): Record<string, HMSRole> => {
  return store.roles;
};

/**
 * Select an array of names of available roles in the room.
 */
export const selectAvailableRoleNames = createSelector([selectRolesMap], rolesMap =>
  Object.keys(rolesMap),
);

/**
 * Select the {@link HMSRole} object of your local peer.
 */
export const selectLocalPeerRole = createSelector(
  [selectLocalPeer, selectRolesMap],
  (localPeer, rolesMap) => (localPeer?.roleName ? rolesMap[localPeer.roleName] : null),
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
