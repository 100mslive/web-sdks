import React, { useState } from 'react';
import { Button, Dialog, Text } from '../../../';
import androidPermissionAlert from '../../../assets/android-perm-0.png';

export function AndroidPermissionModal({ preview }) {
  const [deviceType, setDeviceType] = useState('camera and microphone');

  return deviceType ? (
    <Dialog.Root open={!!deviceType}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content css={{ w: 'min(380px, 90%)', p: '$8' }}>
          <Dialog.Title
            css={{
              borderBottom: '1px solid $border_default',
            }}
          >
            <img src={androidPermissionAlert} style={{ maxWidth: '100%', maxHeight: '100%' }} />

            <Text variant="h6">We can't access your {deviceType}</Text>
          </Dialog.Title>

          <Text variant="sm" css={{ pt: '$4', pb: '$10', color: '$on_surface_medium' }}>
            To allow other users to see and hear you, click the blocked camera icon in your browser's address bar.
          </Text>

          <Button
            css={{ w: '100%' }}
            onClick={() => {
              setDeviceType('');
              preview();
            }}
          >
            Continue
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ) : null;
}
