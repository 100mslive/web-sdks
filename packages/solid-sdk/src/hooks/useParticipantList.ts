import { Accessor, createMemo } from 'solid-js';
import {
  HMSPeer,
  HMSRoleName,
  selectIsConnectedToRoom,
  selectPeerCount,
  selectPeers,
  selectRemotePeers,
} from '@100mslive/hms-video-store';
import { useHMSStore } from '../primitives/HmsRoomProvider';
import { groupByRoles } from '../utils/groupBy';

export interface useParticipantListResult {
  roles: Accessor<HMSRoleName[]>;
  participantsByRoles: Accessor<Record<string, HMSPeer[]>>;
  peerCount: Accessor<number>;
  isConnected: Accessor<boolean | undefined>;
}

export const useParticipantList = (): useParticipantListResult => {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const participantList = createMemo(() => useHMSStore(isConnected() ? selectPeers : selectRemotePeers));
  const peerCount = useHMSStore(selectPeerCount);
  const participantsByRoles = createMemo(() => groupByRoles(participantList()()));
  const roles = () => Object.keys(participantsByRoles());
  return { roles, participantsByRoles, peerCount, isConnected };
};
