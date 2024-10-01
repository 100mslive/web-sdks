import React from 'react';
import { Dialog, Text } from '../../..';
// @ts-ignore: No implicit Any
import { DialogContent, DialogRow } from '../../primitives/DialogContent';

const Instruction = ({ number, description }: { number: string; description: string }) => (
  <DialogRow css={{ alignItems: 'baseline', justifyContent: 'normal', gap: '$4' }}>
    <Text variant="body2">{number}. </Text>
    <Text variant="body2">{description}</Text>
  </DialogRow>
);

export function DeviceInUseModal({
  showDeviceInUseModal,
  setShowDeviceInUseModal,
}: {
  showDeviceInUseModal: boolean;
  setShowDeviceInUseModal: (show: boolean) => void;
}) {
  return (
    <Dialog.Root
      open={showDeviceInUseModal}
      onOpenChange={() => {
        setShowDeviceInUseModal(false);
      }}
    >
      <DialogContent title="Device Access Error">
        <DialogRow>
          <Text variant="body2">
            We weren't able to access your camera since it's either in use by another application or is not configured
            properly. Please follow the following instructions to resolve this issue.
          </Text>
        </DialogRow>
        <Instruction
          number="1"
          description="Please check if the camera is in use by another browser or application and close it."
        />
        <Instruction
          number="2"
          description="Go to Browser Settings > Privacy and security > Site settings > Camera and check if your preferred device is selected as default."
        />
        <Instruction number="3" description="Try restarting the browser." />
        <Instruction
          number="4"
          description="Try disconnecting and reconnecting the external device if your intention is to use one."
        />
      </DialogContent>
    </Dialog.Root>
  );
}
