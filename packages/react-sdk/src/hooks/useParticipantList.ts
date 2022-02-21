import { useMemo } from 'react';
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
  roles: HMSRoleName[];
  participantsByRoles: Record<string, HMSPeer[]>;
  peerCount: number;
  isConnected: boolean;
}

export const useParticipantList = () => {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const participantList = useHMSStore(isConnected ? selectPeers : selectRemotePeers);
  const peerCount = useHMSStore(selectPeerCount);
  const participantsByRoles = useMemo(() => groupByRoles(participantList), [participantList]);
  const roles = Object.keys(participantsByRoles);
  return { roles, participantsByRoles, peerCount, isConnected };
};
