import { useCallback, useEffect, useRef, useState } from 'react';
import {
  selectIsConnectedToRoom,
  selectLocalPeer,
  selectPermissions,
  selectWhiteboard,
} from '@100mslive/hms-video-store';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';

const WHITEBOARD_ORIGIN = 'https://whiteboard-qa.100ms.live';

export const useWhiteboard = () => {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const localPeerUserId = useHMSStore(selectLocalPeer)?.customerUserId;
  const whiteboard = useHMSStore(selectWhiteboard);
  const open = !!whiteboard?.open;
  const isOwner = whiteboard?.owner === localPeerUserId;
  const actions = useHMSActions();
  const [isEnabled, setIsEnabled] = useState(false);
  const permissions = useHMSStore(selectPermissions)?.whiteboard;
  const isAdmin = !!permissions?.includes('admin');
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!whiteboard?.addr || !whiteboard?.token || !iframeRef.current) {
      return;
    }
    iframeRef.current.src = `${WHITEBOARD_ORIGIN}/?endpoint=https://${whiteboard.addr}&token=${whiteboard.token}`;
  }, [whiteboard?.addr, whiteboard?.token]);

  useEffect(() => {
    if (isConnected) {
      setIsEnabled(actions.interactivityCenter.whiteboard.isEnabled);
    }
  }, [isConnected, actions]);

  const toggle = useCallback(async () => {
    if (!isConnected || !isAdmin) {
      return;
    }

    if (open) {
      isOwner && (await actions.interactivityCenter.whiteboard.close());
    } else {
      await actions.interactivityCenter.whiteboard.open();
    }
  }, [actions, isOwner, isAdmin, open, isConnected]);

  return {
    open,
    isOwner,
    isAdmin,
    iframeRef,
    toggle: isEnabled && isAdmin ? toggle : undefined,
  };
};
