import React from 'react';
import { useHMSActions } from '@100mslive/react-sdk';
import { Button } from '../../Button';
import { Dialog } from '../../Modal';
import { DialogContent, DialogRow } from '../primitives/DialogContent';

export const ScreenShareHintModal = ({ onClose }) => {
  const hmsActions = useHMSActions();
  return (
    <Dialog.Root defaultOpen onOpenChange={value => !value && onClose()}>
      <DialogContent title="AudioOnly Screenshare">
        <img
          src="https://images.app.100ms.live/share-audio.png"
          alt="AudioOnly Screenshare instructions"
          width="100%"
        />
        <DialogRow justify="end">
          <Button
            variant="primary"
            onClick={() => {
              hmsActions
                .setScreenShareEnabled(true, {
                  audioOnly: true,
                  displaySurface: 'browser',
                })
                .catch(console.error);
              onClose();
            }}
            data-testid="audio_screenshare_continue"
          >
            Continue
          </Button>
        </DialogRow>
      </DialogContent>
    </Dialog.Root>
  );
};
