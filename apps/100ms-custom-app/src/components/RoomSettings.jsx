import React, { useState } from 'react';
import { Box, Button, Dialog, Flex, styled } from '@100mslive/react-ui';
import { DialogContent } from './DialogContent';
import StreamingRecordingSettings from './StreamingRecordingSettings';
import ThemeSettings from './ThemeSettings';

const TabButton = styled('button', {
  p: '$8',
  bg: 'transparent',
  r: '$1',
  my: '$2',
  fontWeight: '$medium',
  textAlign: 'left',
  variants: {
    active: {
      true: {
        bg: '$bgSecondary',
      },
    },
  },
});

export default function RoomSettings({ onClose, settings, change, handleLogoChange, onSave, onCancel }) {
  const [tab, setTab] = useState(0);
  return (
    <Dialog.Root defaultOpen onOpenChange={value => !value && onClose()}>
      <DialogContent title="Customise your app" css={{ width: 'min(700px, 100%)', height: 'min(700px, 90%)' }}>
        <Flex css={{ size: '100%', overflow: 'hidden' }}>
          <Box css={{ flex: '1 1 0', pt: '$6' }}>
            <Flex direction="column">
              <TabButton active={tab === 0} onClick={() => setTab(0)}>
                Theme
              </TabButton>
              <TabButton active={tab === 1} onClick={() => setTab(1)}>
                Streaming/Recording
              </TabButton>
            </Flex>
          </Box>
          <Box css={{ flex: '3 1 0', ml: '$8', overflowY: 'auto' }}>
            {tab === 0 && <ThemeSettings change={change} settings={settings} handleLogoChange={handleLogoChange} />}
            {tab === 1 && <StreamingRecordingSettings change={change} settings={settings} />}
          </Box>
        </Flex>
        <Flex justify="end" align="center" css={{ mt: '$8' }}>
          <Button variant="standard" css={{ mr: '$8' }} onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </Flex>
      </DialogContent>
    </Dialog.Root>
  );
}