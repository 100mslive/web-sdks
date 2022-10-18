import React from 'react';
import { useAutoplayError } from '@100mslive/react-sdk';
import { Dialog, Text, Button, Flex, HorizontalDivider, Box } from '@100mslive/react-ui';

export const DialogContent = ({ title, closeable = true, children }) => {
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

export const DialogRow = ({ justify = 'between', children }) => {
  let finalCSS = {
    margin: '$10 0',
    w: '100%',
  };
  return (
    <Flex align="center" justify={justify} css={finalCSS}>
      {children}
    </Flex>
  );
};

const AutoplayErrorHook = () => {
  const { error, resetError, unblockAudio } = useAutoplayError();
  return (
    <>
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
    </>
  );
};

const AutoplayErrorStories = {
  title: 'Hooks/useAutoplayError',
  component: AutoplayErrorHook,
};

export default AutoplayErrorStories;

export const UseAutoplayErroHook = AutoplayErrorHook.bind({});
AutoplayErrorStories.storyName = 'useAutoplayError';
