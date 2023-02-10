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
  /**
   * list of participants that match the given filters
   */
  participants: HMSPeer[];
  /**
   * Total number of participants in the room
   */
  peerCount: number;
  /**
   * is joined in the room
   */
  isConnected: boolean;
  /**
   * role names with at least one participant present with that role
   */
  rolesWithParticipants: HMSRoleName[];
}

export type useParticipantsParams = {
  /** To filter by particular role */
  role: HMSRoleName;
  /**
   * To filter by particular by metadata. only supports `{ isHandRaised: true }` for now
   * @beta
   */
  metadata: Record<string, any>;
  /** To filter by name/role (partial match) */
  search: string;
};

/**
 * This can be used to get the total count of participants in the room, participants
 * filtered by role or metadata with isHandRaised or the entire participants if no params are passed
 * @param {useParticipantsParams} params
 * @returns {useParticipantsResult}
 */
export const useParticipants = (params?: useParticipantsParams) => {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peerCount = useHMSStore(selectPeerCount);
  const availableRoles = useHMSStore(selectAvailableRoleNames);
  let participantList = useHMSStore(isConnected ? selectPeers : selectRemotePeers);
  const rolesWithParticipants = Array.from(new Set(participantList.map(peer => peer.roleName)));
  const vanillaStore = useHMSVanillaStore();
  if (params?.metadata?.isHandRaised) {
    participantList = participantList.filter(peer => {
      return vanillaStore.getState(selectPeerMetadata(peer.id)).isHandRaised;
    });
  }
  if (params?.role && availableRoles.includes(params.role)) {
    participantList = participantList.filter(peer => peer.roleName === params.role);
  }
  if (params?.search) {
    const search = params.search.toLowerCase();
    participantList = participantList.filter(
      peer => peer.roleName?.toLowerCase().includes(search) || peer.name.toLowerCase().includes(search),
    );
  }
  return { participants: participantList, isConnected, peerCount, rolesWithParticipants };
};
