import { useCallback, useEffect, useState } from 'react';
import {
  selectAppData,
  selectIsConnectedToRoom,
  selectPermissions,
  selectWhiteboard,
} from '@100mslive/hms-video-store';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';

export const useWhiteboard = (isMobile = false) => {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const whiteboard = useHMSStore(selectWhiteboard);
  const isHeadless = useHMSStore(selectAppData('disableNotifications'));
  const open = !!whiteboard?.open;
  // Set only by this client opening the whiteboard. Comparing `owner` to the local customerUserId
  // would also match a duplicate tab, which must not be offered the close control.
  const isOwner = !!whiteboard?.isLocalOwner;
  const actions = useHMSActions();
  const [isEnabled, setIsEnabled] = useState(false);
  const permissions = useHMSStore(selectPermissions)?.whiteboard;
  const isAdmin = !!permissions?.includes('admin');

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
    token: whiteboard?.token,
    endpoint: whiteboard?.addr,
    isOwner,
    isAdmin,
    zoomToContent: isHeadless || isMobile,
    toggle: isEnabled && isAdmin ? toggle : undefined,
  };
};
