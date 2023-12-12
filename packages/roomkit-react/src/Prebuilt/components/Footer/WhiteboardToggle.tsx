import React from 'react';
import { useWhiteboard } from '@100mslive/react-sdk';
import { PencilDrawIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../..';
// @ts-ignore: No implicit Any
import IconButton from '../../IconButton';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';

export const WhiteboardToggle = () => {
  const { toggle, open, isOwner } = useWhiteboard();
  if (!toggle) {
    return null;
  }

  return (
    <Tooltip key="whiteboard" title={`${open ? 'Close' : 'Open'} Whiteboard`}>
      <IconButton
        onClick={async () => {
          try {
            await toggle();
          } catch (error) {
            ToastManager.addToast({ title: (error as Error).message, variant: 'error' });
          }
        }}
        active={!open}
        disabled={open && !isOwner}
        data-testid="whiteboard_btn"
      >
        <PencilDrawIcon />
      </IconButton>
    </Tooltip>
  );
};
