import { createSelector } from 'reselect';
import { selectLocalPeerRole, selectPeersMap, selectPreviewRole, selectRolesMap, selectTracksMap } from './selectors';
import { isRoleAllowedToPublish } from './selectorUtils';
import { HMSRole } from '../internal';
import { HMSPeer, HMSStore } from '../schema';

export interface HMSPeerWithMuteStatus {
  peer: HMSPeer;
  isAudioEnabled?: boolean;
}

/**
 * @privateRemarks
 * this is more friendly to UI format, the object in store has only peer id and role name instead of the full objects
 */
export interface HMSRoleChangeRequest {
  requestedBy?: HMSPeer;
  role: HMSRole;
  token: string;
}

export const selectPeersWithAudioStatus = createSelector([selectPeersMap, selectTracksMap], (peersMap, tracksMap) => {
  const participants: HMSPeerWithMuteStatus[] = Object.values(peersMap).map(peer => {
    return {
      peer: peer,
      isAudioEnabled: peer.audioTrack ? tracksMap[peer.audioTrack]?.enabled : false,
    };
  });
  return participants;
});

const selectRoleChangeStoreRequest = (store: HMSStore) => {
  return store.roleChangeRequests[0] || null;
};

/**
 * Select the role change request received for your local peer.
 */
export const selectRoleChangeRequest = createSelector(
  [selectRoleChangeStoreRequest, selectPeersMap, selectRolesMap],
  (request, peersMap, rolesMap): HMSRoleChangeRequest | null => {
    if (!request) {
      return null;
    }
    return {
      requestedBy: request.requestedBy ? peersMap[request.requestedBy] : undefined,
      role: rolesMap[request.roleName],
      token: request.token,
    };
  },
);

/**
 * Select what streams is the local peer allowed to publish from video, audio and screenshare.
 */
export const selectIsAllowedToPublish = createSelector([selectLocalPeerRole], role => isRoleAllowedToPublish(role));

/**
 * Select what streams is the local peer allowed to preview from video, audio
 */
export const selectIsAllowedToPreviewMedia = createSelector([selectPreviewRole], role => isRoleAllowedToPublish(role));
