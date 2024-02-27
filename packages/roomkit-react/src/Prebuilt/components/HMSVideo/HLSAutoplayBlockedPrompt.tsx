import React from 'react';
import { Button, Dialog, Text } from '../../..';
// @ts-ignore
import { DialogContent, DialogRow } from '../../primitives/DialogContent';

export function HLSAutoplayBlockedPrompt({
  open,
  unblockAutoPlay,
}: {
  open: boolean;
  unblockAutoPlay: () => Promise<void>;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={async value => {
        if (!value) {
          await unblockAutoPlay();
        }
      }}
    >
      <DialogContent title="Attention" closeable={false}>
        <DialogRow>
          <Text variant="md">
            The browser wants us to get a confirmation for playing the HLS Stream. Please click "play stream" to
            proceed.
          </Text>
        </DialogRow>
        <DialogRow justify="end">
          <Button
            variant="primary"
            onClick={async () => {
              await unblockAutoPlay();
            }}
          >
            Play stream
          </Button>
        </DialogRow>
      </DialogContent>
    </Dialog.Root>
  );
}
