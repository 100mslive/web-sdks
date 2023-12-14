import { useCallback, useEffect, useRef } from 'react';
import { selectLocalPeer, selectPermissions, selectWhiteboard } from '@100mslive/hms-video-store';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';

const WHITEBOARD_ORIGIN = 'https://whiteboard-qa.100ms.live';

export const useWhiteboard = () => {
  const localPeerUserId = useHMSStore(selectLocalPeer)?.customerUserId;
  const whiteboard = useHMSStore(selectWhiteboard);
  const open = !!whiteboard?.open;
  const isOwner = whiteboard?.owner === localPeerUserId;
  const actions = useHMSActions().interactivityCenter.whiteboard;
  const permissions = useHMSStore(selectPermissions)?.whiteboard;
  const isAdmin = !!permissions?.includes('admin');
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!whiteboard?.addr || !whiteboard?.token || !iframeRef.current) {
      return;
    }
    iframeRef.current.src = `${WHITEBOARD_ORIGIN}/?endpoint=https://${whiteboard.addr}&token=${whiteboard.token}`;
  }, [whiteboard?.addr, whiteboard?.token]);

  const toggle = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    if (open) {
      isOwner && (await actions.close());
    } else {
      await actions.open();
    }
  }, [actions, isOwner, isAdmin, open]);

  return {
    open,
    isOwner,
    isAdmin,
    iframeRef,
    toggle: actions.isEnabled && isAdmin ? toggle : undefined,
  };
};
