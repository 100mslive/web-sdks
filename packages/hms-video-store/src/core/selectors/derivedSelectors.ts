import { HMSPeer, HMSStore } from '../schema';
import { selectPeersMap, selectRolesMap, selectTracksMap } from './selectors';
import { createSelector } from 'reselect';
import { HMSRole } from '@100mslive/hms-video/dist/interfaces/role';

export interface HMSPeerWithMuteStatus {
  peer: HMSPeer;
  isAudioEnabled?: boolean;
}

/**
 * @privateRemarks
 * this is more friendly to UI format, the object in store has only peer id and role name instead of the full objects
 */
export interface HMSRoleChangeRequest {
  requestedBy: HMSPeer;
  role: HMSRole;
  token: string;
}

export const selectPeersWithAudioStatus = createSelector(
  [selectPeersMap, selectTracksMap],
  (peersMap, tracksMap) => {
    const participants: HMSPeerWithMuteStatus[] = Object.values(peersMap).map(peer => {
      return {
        peer: peer,
        isAudioEnabled: peer.audioTrack ? tracksMap[peer.audioTrack]?.enabled : false,
      };
    });
    return participants;
  },
);

const selectRoleChangeStoreRequest = (store: HMSStore) => {
  return store.roleChangeRequests[0] || null;
};

export const selectRoleChangeRequest = createSelector(
  [selectRoleChangeStoreRequest, selectPeersMap, selectRolesMap],
  (request, peersMap, rolesMap): HMSRoleChangeRequest | null => {
    if (!request) {
      return null;
    }
    return {
      requestedBy: peersMap[request.requestedBy],
      role: rolesMap[request.roleName],
      token: request.token,
    };
  },
);
