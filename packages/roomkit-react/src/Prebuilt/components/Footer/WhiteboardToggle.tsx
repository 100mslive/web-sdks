import React from 'react';
import { selectWhiteboard, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { PencilDrawIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../..';
// @ts-ignore: No implicit Any
import IconButton from '../../IconButton';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';

export const WhiteboardToggle = () => {
  const open = useHMSStore(selectWhiteboard)?.open;
  const actions = useHMSActions().interactivityCenter.whiteboard;

  const toggle = async () => {
    try {
      if (open) {
        await actions.close();
      } else {
        await actions.open();
      }
    } catch (error) {
      ToastManager.addToast({ title: (error as Error).message, variant: 'error' });
    }
  };

  return (
    <Tooltip key="whiteboard" title={`${open ? 'Close' : 'Open'} Whiteboard`}>
      <IconButton onClick={toggle} active={!open} data-testid="whiteboard_btn">
        <PencilDrawIcon />
      </IconButton>
    </Tooltip>
  );
};
