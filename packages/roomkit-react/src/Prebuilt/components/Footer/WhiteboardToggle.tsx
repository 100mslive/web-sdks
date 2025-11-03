import { useState } from 'react';
import { selectPeerScreenSharing, useHMSStore, useWhiteboard } from '@100mslive/react-sdk';
import { PencilDrawIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../..';
// @ts-ignore: No implicit Any
import IconButton from '../../IconButton';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';

export const WhiteboardToggle = () => {
  const { toggle, open, isOwner } = useWhiteboard();
  const peerSharing = useHMSStore(selectPeerScreenSharing);
  const disabled = !!peerSharing || (open && !isOwner);
  const [isLoading, setLoading] = useState(false);

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
            if (!open) {
              setLoading(true);
              await toggle();
              setTimeout(() => setLoading(false), 500);
            } else {
              await toggle();
            }
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
