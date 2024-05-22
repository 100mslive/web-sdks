import React from 'react';
import { HMSTranscriptionMode, selectIsTranscriptionEnabled, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { AlertTriangleIcon, CrossIcon } from '@100mslive/react-icons';
import { Button } from '../../../Button';
import { Box, Flex } from '../../../Layout';
import { Loading } from '../../../Loading';
import { Text } from '../../../Text';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
// @ts-ignore: No implicit Any
import { useSetIsCaptionEnabled } from '../AppData/useUISettings';

export const CaptionContent = ({ isMobile, onExit }: { isMobile: boolean; onExit: () => void }) => {
  const DURATION = 2000;
  const actions = useHMSActions();
  const isTranscriptionEnabled = useHMSStore(selectIsTranscriptionEnabled);

  const [isCaptionEnabled, setIsCaptionEnabled] = useSetIsCaptionEnabled();
  return (
    <>
      <Text
        variant={isMobile ? 'md' : 'lg'}
        css={{
          color: '$on_surface_high',
          fontWeight: '$semiBold',
          display: 'flex',
          pb: '$4',
          '@md': { px: '$8', borderBottom: '1px solid $border_default' },
        }}
      >
        {isTranscriptionEnabled ? 'Disable' : 'Enable'} Closed Caption (CC) for this session?
        <Box
          css={{ color: 'inherit', ml: 'auto', '&:hover': { color: '$on_surface_medium', cursor: 'pointer' } }}
          onClick={onExit}
        >
          <CrossIcon />
        </Box>
      </Text>
      {!isMobile ? (
        <Text variant="sm" css={{ color: '$on_surface_medium', pb: '$6', mb: '$8', '@md': { px: '$8', mt: '$4' } }}>
          This will {isTranscriptionEnabled ? 'disable' : 'enable'} Closed Captions for everyone in this room. You can
          {isTranscriptionEnabled ? 'enable' : 'disable'} it later.
        </Text>
      ) : null}

      <Flex
        justify="between"
        align="center"
        css={{
          width: '100%',
          gap: '$md',
          mt: '$10',
          '@md': { px: '$4' },
        }}
      >
        {isMobile ? null : (
          <Button variant="standard" css={{ w: '100%' }} outlined onClick={onExit}>
            Cancel
          </Button>
        )}
        <Flex
          direction="column"
          justify="between"
          align="center"
          css={{
            width: '100%',
          }}
        >
          {isMobile && isTranscriptionEnabled ? (
            <Button
              variant="standard"
              css={{ w: '100%', mb: '$8' }}
              outlined
              onClick={() => {
                setIsCaptionEnabled(!isCaptionEnabled);
                onExit();
              }}
            >
              {isCaptionEnabled ? 'Hide For Me' : 'Show For Me'}
            </Button>
          ) : null}
          <Button
            variant={isTranscriptionEnabled ? 'danger' : 'primary'}
            css={{ width: '100%' }}
            data-testid="popup_change_btn"
            onClick={async () => {
              try {
                if (isTranscriptionEnabled) {
                  await actions.stopTranscription({
                    mode: HMSTranscriptionMode.CAPTION,
                  });
                  ToastManager.addToast({
                    title: `Disabling Closed Caption for everyone.`,
                    variant: 'standard',
                    duration: DURATION,
                    icon: <Loading color="currentColor" />,
                  });
                  onExit();
                  return;
                }
                await actions.startTranscription({
                  mode: HMSTranscriptionMode.CAPTION,
                });
                ToastManager.addToast({
                  title: `Enabling Closed Caption for everyone.`,
                  variant: 'standard',
                  duration: DURATION,
                  icon: <Loading color="currentColor" />,
                });
              } catch (err) {
                ToastManager.addToast({
                  title: `Failed to ${isTranscriptionEnabled ? 'disabled' : 'enabled'} closed caption`,
                  variant: 'error',
                  icon: <AlertTriangleIcon style={{ marginRight: '0.5rem' }} />,
                });
              }
              onExit();
            }}
          >
            {isTranscriptionEnabled ? 'Disable' : 'Enable'} for Everyone
          </Button>
        </Flex>
      </Flex>
      {isMobile && (
        <Text variant="sm" css={{ color: '$on_surface_medium', pb: '$6', mb: '$8', '@md': { px: '$8', mt: '$4' } }}>
          This will {isTranscriptionEnabled ? 'disable' : 'enable'} Closed Captions for everyone in this room. You can
          {isTranscriptionEnabled ? 'enable' : 'disable'} it later.
        </Text>
      )}
    </>
  );
};
