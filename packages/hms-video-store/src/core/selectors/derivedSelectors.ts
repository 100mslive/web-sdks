import { HMSPeer, HMSStore } from '../schema';
import { selectLocalPeerRole, selectPeersMap, selectRolesMap, selectTracksMap } from './selectors';
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

export interface HMSPublishAllowed {
  video: boolean;
  audio: boolean;
  screen: boolean;
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

/**
 * use this selector to know what streams is the local peer allowed to publish from video, audio and screenshare.
 */
export const selectIsAllowedToPublish = createSelector(
  [selectLocalPeerRole],
  (role): HMSPublishAllowed => {
    let video = false,
      audio = false,
      screen = false;
    if (role?.publishParams?.allowed) {
      video = role.publishParams.allowed.includes('video');
      audio = role.publishParams.allowed.includes('audio');
      screen = role.publishParams.allowed.includes('screen');
    }
    return {
      video,
      audio,
      screen,
    };
  },
);
