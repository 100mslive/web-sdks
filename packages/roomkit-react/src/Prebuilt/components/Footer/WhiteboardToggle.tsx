import React from 'react';
import { selectPeerScreenSharing, useHMSStore, useWhiteboard } from '@100mslive/react-sdk';
import { PencilDrawIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../..';
// @ts-ignore: No implicit Any
import IconButton from '../../IconButton';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';

export const WhiteboardToggle = () => {
  const { toggle, open, isOwner, isLoading } = useWhiteboard();
  const peerSharing = useHMSStore(selectPeerScreenSharing);
  const disabled = !!peerSharing || (open && !isOwner);

  console.log('loading ', isLoading);
  if (!toggle) {
    return null;
  }

  return (
    <Tooltip
      key="whiteboard"
      title={
        peerSharing ? 'Cannot open whiteboard when viewing a shared screen' : `${open ? 'Close' : 'Open'} Whiteboard`
      }
    >
      <IconButton
        onClick={async () => {
          if (disabled || isLoading) {
            return;
          }
          try {
            await toggle();
          } catch (error) {
            ToastManager.addToast({ title: (error as Error).message, variant: 'error' });
          }
        }}
        active={!open}
        disabled={disabled || isLoading}
        data-testid="whiteboard_btn"
      >
        <PencilDrawIcon />
      </IconButton>
    </Tooltip>
  );
};
