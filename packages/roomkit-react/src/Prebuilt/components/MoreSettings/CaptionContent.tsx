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
import { useSetAppDataByKey, useSetIsCaptionEnabled } from '../AppData/useUISettings';
import { CAPTION_TOAST } from '../../common/constants';

export const CaptionContent = ({ isMobile, onExit }: { isMobile: boolean; onExit: () => void }) => {
  const DURATION = 2000;
  const actions = useHMSActions();
  const isTranscriptionEnabled = useHMSStore(selectIsTranscriptionEnabled);
  const [toastId, setToastId] = useSetAppDataByKey(CAPTION_TOAST.captionToast);

  const [isCaptionEnabled, setIsCaptionEnabled] = useSetIsCaptionEnabled();

  return (
    <>
      <Text
        variant={isMobile ? 'md' : 'lg'}
        css={{
          color: 'onSurface.high',
          fontWeight: '$semiBold',
          display: 'flex',
          '@md': { px: '8' },
        }}
      >
        {isTranscriptionEnabled ? 'Disable' : 'Enable'} Closed Caption (CC) for this session?
        <Box
          css={{ color: 'inherit', ml: 'auto', '&:hover': { color: 'onSurface.medium', cursor: 'pointer' } }}
          onClick={onExit}
        >
          <CrossIcon />
        </Box>
      </Text>
      {!isMobile ? (
        <Text variant="sm" css={{ color: 'onSurface.medium', mt: '4', '@md': { px: '8' } }}>
          This will {isTranscriptionEnabled ? 'disable' : 'enable'} Closed Captions for everyone in this room. You
          can&nbsp;
          {isTranscriptionEnabled ? 'enable' : 'disable'} it later.
        </Text>
      ) : null}

      <Flex
        justify="between"
        align="center"
        css={{
          width: '100%',
          gap: 'md',
          mt: '10',
          '@md': { px: '4' },
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
            '@md': { px: '4' },
          }}
        >
          {isMobile && isTranscriptionEnabled ? (
            <Button
              variant="standard"
              css={{ w: '100%', mb: '4' }}
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
                  setIsCaptionEnabled(false);
                  const id = ToastManager.replaceToast(toastId, {
                    title: `Disabling Closed Caption for everyone.`,
                    variant: 'standard',
                    duration: DURATION,
                    icon: <Loading color="currentColor" />,
                  });
                  setToastId(id);
                  onExit();
                  return;
                }
                await actions.startTranscription({
                  mode: HMSTranscriptionMode.CAPTION,
                });
                const id = ToastManager.replaceToast(toastId, {
                  title: `Enabling Closed Caption for everyone.`,
                  variant: 'standard',
                  duration: DURATION,
                  icon: <Loading color="currentColor" />,
                });
                setToastId(id);
              } catch (err) {
                const id = ToastManager.replaceToast(toastId, {
                  title: `Failed to ${isTranscriptionEnabled ? 'disable' : 'enable'} closed caption`,
                  variant: 'error',
                  icon: <AlertTriangleIcon style={{ marginRight: '0.5rem' }} />,
                });
                setToastId(id);
              } finally {
                setIsCaptionEnabled(true);
              }
              onExit();
            }}
          >
            {isTranscriptionEnabled ? 'Disable' : 'Enable'} for Everyone
          </Button>
        </Flex>
      </Flex>
      {isMobile && (
        <Text variant="sm" css={{ color: 'onSurface.medium', pb: '4', mb: '8', '@md': { px: '8', mt: '4' } }}>
          This will {isTranscriptionEnabled ? 'disable' : 'enable'} Closed Captions for everyone in this room. You
          can&nbsp;
          {isTranscriptionEnabled ? 'enable' : 'disable'} it later.
        </Text>
      )}
    </>
  );
};
