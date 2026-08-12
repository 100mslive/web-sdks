import React, { useEffect, useState } from 'react';
import { selectIsLocalAudioInterrupted, selectIsLocalVideoInterrupted, useHMSStore } from '@100mslive/react-sdk';
import { Button, Dialog, Text } from '../../..';
// @ts-ignore: No implicit Any
import { DialogContent, DialogRow } from '../../primitives/DialogContent';

/**
 * A video call takes both devices, so this reads the interrupted state of each and shows one prompt
 * naming what is affected, instead of one prompt per track.
 */
export const TrackInterruptionModal = () => {
  const audioInterrupted = useHMSStore(selectIsLocalAudioInterrupted);
  const videoInterrupted = useHMSStore(selectIsLocalVideoInterrupted);
  const [dismissed, setDismissed] = useState(false);
  const interrupted = audioInterrupted || videoInterrupted;

  // let the next interruption show a prompt again
  useEffect(() => {
    if (!interrupted) {
      setDismissed(false);
    }
  }, [interrupted]);

  let device = 'Microphone';
  if (audioInterrupted && videoInterrupted) {
    device = 'Microphone and camera';
  } else if (videoInterrupted) {
    device = 'Camera';
  }

  return (
    <Dialog.Root open={interrupted && !dismissed} onOpenChange={() => setDismissed(true)}>
      <DialogContent title={`${device} interrupted`} closeable={false}>
        <DialogRow>
          <Text variant="md">
            {`Another app or an incoming call is using your ${device.toLowerCase()}. Once you're done there, it will be
            restored automatically.`}
          </Text>
        </DialogRow>
        <DialogRow justify="end">
          <Button variant="primary" onClick={() => setDismissed(true)}>
            Dismiss
          </Button>
        </DialogRow>
      </DialogContent>
    </Dialog.Root>
  );
};
