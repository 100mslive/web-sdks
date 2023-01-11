import {
  HMSPeerID,
  HMSRoleName,
  HMSStore,
  selectAvailableRoleNames,
  selectIsConnectedToRoom,
  selectPeerByID,
  selectPeerCount,
  selectPeerIDs,
  selectPeerMetadata,
  selectRemotePeerIDs,
} from '@100mslive/hms-video-store';
import { useHMSStore, useHMSVanillaStore } from '../primitives/HmsRoomProvider';
import { IHMSReactStore } from '../primitives/store';

export interface usePeerListResult {
  /**
   * list of participants that match the given filters
   */
  peerIDs: HMSPeerID[];
  /**
   * Total number of participants in the room
   */
  peerCount: number;
  /**
   * is joined in the room
   */
  isConnected: boolean;
  /**
   * role names with atleast one participant present with that role
   */
  rolesWithPeers: HMSRoleName[];
}

export type usePeerListParams = {
  /** To filter by particular role */
  role: HMSRoleName;
  /**
   * To filter by particular by metadata. only supports { isHandRaised: true } for now
   * @beta
   */
  metadata: Record<string, any>;
  /** To filter by name/role (partial match) */
  search: string;
};

const getPeerData = (store: IHMSReactStore<HMSStore>, peerId: HMSPeerID) => {
  return store.getState(selectPeerByID(peerId));
};

/**
 * This can be used to get the total count of participants in the room, participants
 * filtered by role or metadata with isHandRaised or the entire participants if no params are passed
 * @param {usePeerListParams} params
 * @returns {usePeerListResult}
 */
export const usePeerList = (params?: usePeerListParams) => {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peerCount = useHMSStore(selectPeerCount);
  const availableRoles = useHMSStore(selectAvailableRoleNames);
  let peerList = useHMSStore(isConnected ? selectPeerIDs : selectRemotePeerIDs);
  const vanillaStore = useHMSVanillaStore();
  const rolesWithPeers = Array.from(new Set(peerList.map(peerId => getPeerData(vanillaStore, peerId)!.roleName!)));
  if (params?.metadata?.isHandRaised) {
    peerList = peerList.filter(peerId => {
      return vanillaStore.getState(selectPeerMetadata(peerId)).isHandRaised;
    });
  }
  if (params?.role && availableRoles.includes(params.role)) {
    peerList = peerList.filter(peerId => getPeerData(vanillaStore, peerId)?.roleName === params.role);
  }
  if (params?.search) {
    const search = params.search.toLowerCase();
    peerList = peerList.filter(peerId => {
      const peer = getPeerData(vanillaStore, peerId);
      return peer?.roleName?.toLowerCase().includes(search) || peer?.name.toLowerCase().includes(search);
    });
  }
  return { peerIDs: peerList, isConnected, peerCount, rolesWithPeers };
};
