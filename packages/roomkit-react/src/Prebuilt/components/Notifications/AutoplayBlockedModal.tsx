import React from 'react';
import { useAutoplayError } from '@100mslive/react-sdk';
import { Button, Dialog, Text } from '../../..';
// @ts-ignore: No implicit Any
import { DialogContent, DialogRow } from '../../primitives/DialogContent';

export function AutoplayBlockedModal() {
  const { error, resetError, unblockAudio } = useAutoplayError();
  return (
    <Dialog.Root
      open={!!error}
      onOpenChange={async value => {
        if (!value) {
          await unblockAudio();
        }
        resetError();
      }}
    >
      <DialogContent title="Permission Error" closeable={false}>
        <DialogRow>
          <Text variant="md">
            The browser wants us to get a confirmation for playing the Audio. Please allow audio to proceed.
          </Text>
        </DialogRow>
        <DialogRow justify="end">
          <Button
            variant="primary"
            onClick={async () => {
              await unblockAudio();
              resetError();
            }}
          >
            Allow Audio
          </Button>
        </DialogRow>
      </DialogContent>
    </Dialog.Root>
  );
}
