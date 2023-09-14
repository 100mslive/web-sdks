// @ts-check
import { useEffect, useRef, useState } from 'react';
import { JoinForm_JoinBtnType } from '@100mslive/types-prebuilt/elements/join_form';
import {
  selectAvailableRoleNames,
  selectIsConnectedToRoom,
  selectPeerCount,
  selectPeerMetadata,
  selectPeers,
  selectRemotePeers,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { useRoomLayout } from '../provider/roomLayoutProvider';

/**
 * Hook to execute a callback when alone in room(after a certain 5d of time)
 * @param {number} thresholdMs The threshold(in ms) after which the callback is executed,
 * starting from the instant when alone in room.
 * note: the cb is not called when another peer joins during this period.
 */
export const useWhenAloneInRoom = (thresholdMs = 5 * 60 * 1000) => {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peerCount = useHMSStore(selectPeerCount);
  const [aloneForLong, setAloneForLong] = useState(false);
  const cbTimeout = useRef(null);
  const alone = isConnected && peerCount === 1;

  useEffect(() => {
    if (alone && !cbTimeout.current) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      cbTimeout.current = setTimeout(() => {
        setAloneForLong(true);
      }, thresholdMs);
    } else if (!alone) {
      cbTimeout.current && clearTimeout(cbTimeout.current);
      cbTimeout.current = null;
      setAloneForLong(false);
    }
  }, [alone, thresholdMs]);

  useEffect(() => {
    return () => {
      if (cbTimeout.current) {
        clearTimeout(cbTimeout.current);
      }
    };
  }, []);

  return { alone, aloneForLong };
};

export const useFilteredRoles = () => {
  const roles = useHMSStore(selectAvailableRoleNames);
  return roles;
};

export const useShowStreamingUI = () => {
  const layout = useRoomLayout();
  const { join_form } = layout?.screens?.preview?.default?.elements || {};
  return join_form?.join_btn_type === JoinForm_JoinBtnType.JOIN_BTN_TYPE_JOIN_AND_GO_LIVE;
};

// The search results should not have role name matches
export const useParticipants = params => {
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
    const search = params.search;
    // Removed peer.roleName?.toLowerCase().includes(search)
    participantList = participantList.filter(peer => peer.name.toLowerCase().includes(search));
  }
  return { participants: participantList, isConnected, peerCount, rolesWithParticipants };
};
