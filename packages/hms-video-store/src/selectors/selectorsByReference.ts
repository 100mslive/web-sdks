import { createSelector } from 'reselect';
import {
  selectLocalAudioTrackID,
  selectLocalVideoTrackID,
  selectPeers,
  selectRolesMap,
  selectRoom,
  selectTracksMap,
} from './selectors';
import { isRoleAllowedToPublish } from './selectorUtils';
import { HMSPeer, HMSTrack } from '../schema';

export const selectRoleByRoleName = (roleName: string) =>
  createSelector([selectRolesMap], rolesMap => rolesMap[roleName]);

export const selectIsRoleAllowedToPublish = (roleName: string) => {
  return createSelector(selectRoleByRoleName(roleName), role => isRoleAllowedToPublish(role));
};

const selectLocalVideoPlugins = createSelector([selectLocalVideoTrackID, selectTracksMap], (trackID, tracksMap) => {
  let track: HMSTrack | null = null;
  if (trackID) {
    track = tracksMap[trackID];
  }
  return track?.plugins || [];
});

const selectLocalAudioPlugins = createSelector([selectLocalAudioTrackID, selectTracksMap], (trackID, tracksMap) => {
  let track: HMSTrack | null = null;
  if (trackID) {
    track = tracksMap[trackID];
  }
  return track?.plugins || [];
});

export const selectIsLocalVideoPluginPresent = (pluginName: string) => {
  return createSelector([selectLocalVideoPlugins], plugins => {
    return plugins.includes(pluginName);
  });
};

export const selectIsLocalAudioPluginPresent = (pluginName: string) => {
  return createSelector([selectLocalAudioPlugins], plugins => {
    return plugins.includes(pluginName);
  });
};

/**
 * Selects the first peer passing the condition given by the argument predicate function
 *
 * Ex: to select a peer whose metadata has spotlight set to true(assuming peer.metadata is a valid json string), use
 * ```js
 * const spotlightPeer = useHMSStore(selectPeerByCondition(peer => JSON.parse(peer.metadata).spotlight))
 * ```
 */
export const selectPeerByCondition = (predicate: (peer: HMSPeer) => boolean) =>
  createSelector(selectPeers, peers => {
    return peers.find(predicate);
  });

/**
 * Selects all peers passing the condition given by the argument predicate function
 *
 * Ex: to select peers with isHandRaised set to true in their metadata(assuming peer.metadata is a valid json string), use
 * ```js
 * const handRaisedPeers = useHMSStore(selectPeersByCondition(peer => JSON.parse(peer.metadata).isHandRaised))
 * ```
 */
export const selectPeersByCondition = (predicate: (peer: HMSPeer) => boolean) =>
  createSelector(selectPeers, peers => {
    return peers.filter(predicate);
  });

/**
 * Returns a boolean to indicate if the local peer joined within the past `timeMs` milliseconds.
 *
 * Ex: to know if the local peer joined within the last one second
 * ```js
 * const joinedWithinASecond = useHMSStore(selectDidIJoinWithin(1000));
 * ```
 */
export const selectDidIJoinWithin = (timeMs: number) =>
  createSelector(selectRoom, room => room.joinedAt && Date.now() - room.joinedAt.getTime() <= timeMs);
