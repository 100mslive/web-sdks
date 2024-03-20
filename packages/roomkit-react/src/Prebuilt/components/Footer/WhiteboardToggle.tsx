import React from 'react';
import { useScreenShare, useWhiteboard } from '@100mslive/react-sdk';
import { PencilDrawIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../..';
// @ts-ignore: No implicit Any
import IconButton from '../../IconButton';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';

export const WhiteboardToggle = () => {
  const { toggle, open, isOwner } = useWhiteboard();
  const { screenSharingPeerId, amIScreenSharing } = useScreenShare();
  const remoteScreenShare = screenSharingPeerId && !amIScreenSharing;
  const disabled = remoteScreenShare || (open && !isOwner);

  if (!toggle) {
    return null;
  }

  return (
    <Tooltip
      key="whiteboard"
      title={
        remoteScreenShare
          ? 'Cannot open whiteboard when viewing a shared screen'
          : `${open ? 'Close' : 'Open'} Whiteboard`
      }
    >
      <IconButton
        onClick={async () => {
          if (disabled) {
            return;
          }
          try {
            await toggle();
          } catch (error) {
            ToastManager.addToast({ title: (error as Error).message, variant: 'error' });
          }
        }}
        active={!open}
        disabled={disabled}
        data-testid="whiteboard_btn"
      >
        <PencilDrawIcon />
      </IconButton>
    </Tooltip>
  );
};
