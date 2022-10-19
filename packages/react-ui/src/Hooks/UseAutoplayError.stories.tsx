import React from 'react';
import { useAutoplayError, useHMSActions } from '@100mslive/react-sdk';
import { Dialog, Text, Button, Flex, HorizontalDivider, Box } from '@100mslive/react-ui';
import { HMSException } from '@100mslive/hms-video';

import { StoryBookSDK } from '../store/StorybookSDK';
import mdx from './UseAutoplayError.mdx';

const DialogContent = ({
  title,
  closeable = true,
  children,
}: {
  title: string;
  closeable: boolean;
  children: React.ReactNode;
}) => {
  return (
    <Dialog.Portal>
      <Dialog.Overlay />
      <Dialog.Content css={{ width: 'min(600px, 100%)' }}>
        <Dialog.Title>
          <Flex justify="between">
            <Flex align="center" css={{ mb: '$1' }}>
              <Text variant="h6" inline>
                {title}
              </Text>
            </Flex>
            {closeable && <Dialog.DefaultClose data-testid="dialoge_cross_icon" />}
          </Flex>
        </Dialog.Title>
        <HorizontalDivider css={{ mt: '0.8rem' }} />
        <Box>{children}</Box>
      </Dialog.Content>
    </Dialog.Portal>
  );
};

const DialogRow = ({
  justify = 'between',
  children,
}: {
  justify?: React.ComponentProps<typeof Flex>['justify'];
  children: React.ReactNode;
}) => {
  const finalCSS = {
    margin: '$10 0',
    w: '100%',
  };
  return (
    <Flex align="center" justify={justify} css={finalCSS}>
      {children}
    </Flex>
  );
};

const UseAutoplayErrorHook = () => {
  const { error, resetError, unblockAudio } = useAutoplayError();

  const actions = useHMSActions();
  function sendAutoplayError() {
    (actions as unknown as StoryBookSDK).sendError(
      new HMSException(3008, 'Autoplay error', 'NONE', 'Nothing has happened.', 'Nothing has happened.'),
    );
  }

  return (
    <Box>
      <Button variant="primary" onClick={() => sendAutoplayError()}>
        Send Error
      </Button>
      <Dialog.Root
        open={!!error}
        onOpenChange={value => {
          if (!value) {
            unblockAudio();
          }
          resetError();
        }}
      >
        <DialogContent title="Autoplay Error" closeable={false}>
          <DialogRow>
            <Text variant="md">
              The browser wants us to get a confirmation for playing the Audio. Please allow audio to proceed.
            </Text>
          </DialogRow>
          <DialogRow justify="end">
            <Button
              variant="primary"
              onClick={() => {
                unblockAudio();
                resetError();
              }}
            >
              Allow Audio
            </Button>
          </DialogRow>
        </DialogContent>
      </Dialog.Root>
    </Box>
  );
};

const AutoplayErrorStories = {
  title: 'Hooks/useAutoplayError',
  component: UseAutoplayErrorHook,
  parameters: {
    docs: {
      page: mdx,
    },
  },
};

export default AutoplayErrorStories;

export const UseAutoplayErroHook = UseAutoplayErrorHook.bind({});
UseAutoplayErroHook.storyName = 'useAutoplayError';
