import {
  HMSPeer,
  HMSRoleName,
  selectAvailableRoleNames,
  selectIsConnectedToRoom,
  selectPeerCount,
  selectPeerMetadata,
  selectPeers,
  selectRemotePeers,
} from '@100mslive/hms-video-store';
import { useHMSStore, useHMSVanillaStore } from '../primitives/HmsRoomProvider';

export interface useParticipantsResult {
  participants: HMSPeer;
  peerCount: number;
  isConnected: boolean;
  rolesWithParticipants: HMSRoleName[];
}

export type useParticipantsParams = 'isHandRaise' | { role: HMSRoleName };
export const useParticipants = (params?: useParticipantsParams) => {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peerCount = useHMSStore(selectPeerCount);
  const availableRoles = useHMSStore(selectAvailableRoleNames);
  let participantList = useHMSStore(isConnected ? selectPeers : selectRemotePeers);
  const rolesWithParticipants = Array.from(new Set(participantList.map(peer => peer.roleName)));
  const vanillaStore = useHMSVanillaStore();
  if (params === 'isHandRaise') {
    participantList = participantList.filter(peer => {
      return vanillaStore.getState(selectPeerMetadata(peer.id)).isHandRaised;
    });
  }
  if (typeof params === 'object' && availableRoles.includes(params.role)) {
    participantList = participantList.filter(peer => peer.roleName === params.role);
  }
  return { participants: participantList, isConnected, peerCount, rolesWithParticipants };
};
