import React, { useState } from 'react';
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
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [roleLanguagesJson, setRoleLanguagesJson] = useState('{"broadcaster": "es", "co-broadcaster": "fr"}');

  const [isCaptionEnabled, setIsCaptionEnabled] = useSetIsCaptionEnabled();

  return (
    <>
      <Text
        variant={isMobile ? 'md' : 'lg'}
        css={{
          color: '$on_surface_high',
          fontWeight: '$semiBold',
          display: 'flex',
          '@md': { px: '$8' },
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
        <Text variant="sm" css={{ color: '$on_surface_medium', mt: '$4', '@md': { px: '$8' } }}>
          This will {isTranscriptionEnabled ? 'disable' : 'enable'} Closed Captions for everyone in this room. You
          can&nbsp;
          {isTranscriptionEnabled ? 'enable' : 'disable'} it later.
        </Text>
      ) : null}

      {/* Translation config (testing UI) */}
      {!isTranscriptionEnabled && (
        <Box css={{ mt: '$6', '@md': { px: '$8' } }}>
          <Flex align="center" css={{ gap: '$4', mb: '$4' }}>
            <input
              type="checkbox"
              checked={translationEnabled}
              onChange={e => setTranslationEnabled(e.target.checked)}
              id="translation-toggle"
            />
            <Text as="label" htmlFor="translation-toggle" variant="sm" css={{ color: '$on_surface_medium' }}>
              Enable Translation
            </Text>
          </Flex>
          {translationEnabled && (
            <Box css={{ mb: '$4' }}>
              <Text variant="xs" css={{ color: '$on_surface_low', mb: '$2' }}>
                Role → Language mapping (JSON). ISO 639-1 codes.
              </Text>
              <textarea
                value={roleLanguagesJson}
                onChange={e => setRoleLanguagesJson(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '60px',
                  background: 'transparent',
                  border: '1px solid var(--hms-ui-colors-border_default)',
                  borderRadius: '8px',
                  color: 'var(--hms-ui-colors-on_surface_high)',
                  padding: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Runtime translation toggle (when captions are already running) */}
      {isTranscriptionEnabled && (
        <Flex css={{ mt: '$4', gap: '$4', '@md': { px: '$8' } }}>
          <Button
            variant="standard"
            outlined
            css={{ flex: 1 }}
            onClick={async () => {
              try {
                let roleLanguages;
                try {
                  roleLanguages = JSON.parse(roleLanguagesJson);
                } catch (e) {
                  roleLanguages = undefined;
                }
                await actions.updateTranscriptionConfig({
                  translation: { enabled: true, roleLanguages },
                });
                ToastManager.addToast({ title: 'Translation enabled', variant: 'standard', duration: 2000 });
              } catch (err) {
                ToastManager.addToast({ title: 'Failed to enable translation', variant: 'error' });
              }
            }}
          >
            Enable Translation
          </Button>
          <Button
            variant="standard"
            outlined
            css={{ flex: 1 }}
            onClick={async () => {
              try {
                await actions.updateTranscriptionConfig({
                  translation: { enabled: false },
                });
                ToastManager.addToast({ title: 'Translation disabled', variant: 'standard', duration: 2000 });
              } catch (err) {
                ToastManager.addToast({ title: 'Failed to disable translation', variant: 'error' });
              }
            }}
          >
            Disable Translation
          </Button>
        </Flex>
      )}

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
            '@md': { px: '$4' },
          }}
        >
          {isMobile && isTranscriptionEnabled ? (
            <Button
              variant="standard"
              css={{ w: '100%', mb: '$4' }}
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
                const startParams: any = {
                  mode: HMSTranscriptionMode.CAPTION,
                };
                if (translationEnabled) {
                  try {
                    startParams.translation = { enabled: true, roleLanguages: JSON.parse(roleLanguagesJson) };
                  } catch (e) {
                    startParams.translation = { enabled: true };
                  }
                }
                await actions.startTranscription(startParams);
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
        <Text variant="sm" css={{ color: '$on_surface_medium', pb: '$4', mb: '$8', '@md': { px: '$8', mt: '$4' } }}>
          This will {isTranscriptionEnabled ? 'disable' : 'enable'} Closed Captions for everyone in this room. You
          can&nbsp;
          {isTranscriptionEnabled ? 'enable' : 'disable'} it later.
        </Text>
      )}
    </>
  );
};
