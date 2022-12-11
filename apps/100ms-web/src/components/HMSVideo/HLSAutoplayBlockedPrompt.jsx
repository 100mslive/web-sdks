import React from "react";
import { Button, Dialog, Text } from "@100mslive/react-ui";
import { DialogContent, DialogRow } from "../../primitives/DialogContent";

export function HLSAutoplayBlockedPrompt({
  error,
  unblockAutoPlay,
  resetAutoPlayError,
}) {
  return (
    <Dialog.Root
      open={!!error}
      onOpenChange={value => {
        if (!value) {
          unblockAutoPlay();
        }
        resetAutoPlayError();
      }}
    >
      <DialogContent title="Attention" closeable={false}>
        <DialogRow>
          <Text variant="md">
            {" "}
            The browser wants us to get a confirmation for playing the HLS
            Stream. Please click "play stream" to proceed..
          </Text>
        </DialogRow>
        <DialogRow justify="end">
          <Button
            variant="primary"
            onClick={() => {
              unblockAutoPlay();
              resetAutoPlayError();
            }}
          >
            play stream
          </Button>
        </DialogRow>
      </DialogContent>
    </Dialog.Root>
  );
}
