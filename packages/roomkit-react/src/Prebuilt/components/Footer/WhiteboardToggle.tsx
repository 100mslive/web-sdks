import React from 'react';
import { selectLocalPeer, selectWhiteboard, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { PencilDrawIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../..';
// @ts-ignore: No implicit Any
import IconButton from '../../IconButton';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';

export const WhiteboardToggle = () => {
  const localPeerUserId = useHMSStore(selectLocalPeer)?.customerUserId;
  const open = useHMSStore(selectWhiteboard)?.open;
  const isOwner = useHMSStore(selectWhiteboard)?.owner === localPeerUserId;
  const actions = useHMSActions().interactivityCenter.whiteboard;

  const toggle = async () => {
    try {
      if (open) {
        isOwner && (await actions.close());
      } else {
        await actions.open();
      }
    } catch (error) {
      ToastManager.addToast({ title: (error as Error).message, variant: 'error' });
    }
  };

  return (
    <Tooltip key="whiteboard" title={`${open ? 'Close' : 'Open'} Whiteboard`}>
      <IconButton onClick={toggle} active={!open} disabled={open && !isOwner} data-testid="whiteboard_btn">
        <PencilDrawIcon />
      </IconButton>
    </Tooltip>
  );
};
