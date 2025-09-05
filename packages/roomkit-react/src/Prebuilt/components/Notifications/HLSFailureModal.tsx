import React, { useCallback, useState } from 'react';
import { selectHLSState, useHMSActions, useHMSStore, useRecordingStreaming } from '@100mslive/react-sdk';
import { Button } from '../../../Button';
import { Flex } from '../../../Layout';
import { Dialog } from '../../../Modal';
import { Text } from '../../../Text';
// @ts-ignore: No implicit Any
import { useSetAppDataByKey } from '../AppData/useUISettings';
// @ts-ignore: No implicit Any
import { APP_DATA } from '../../common/constants';

export function HLSFailureModal() {
  const hlsError = useHMSStore(selectHLSState).error || false;
  const [openModal, setOpenModal] = useState(!!hlsError);
  const hmsActions = useHMSActions();
  const { isRTMPRunning } = useRecordingStreaming();
  const [isHLSStarted, setHLSStarted] = useSetAppDataByKey(APP_DATA.hlsStarted);
  const startHLS = useCallback(async () => {
    try {
      if (isHLSStarted || isRTMPRunning) {
        return;
      }
      setHLSStarted(true);
      await hmsActions.startHLSStreaming({});
    } catch (error) {
      console.error(error);
      setHLSStarted(false);
    }
  }, [hmsActions, isHLSStarted, setHLSStarted, isRTMPRunning]);

  return hlsError ? (
    <Dialog.Root
      open={openModal}
      onOpenChange={(value: boolean) => {
        if (!value) {
          setOpenModal(false);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content css={{ w: 'min(360px, 90%)' }}>
          <Dialog.Title
            css={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid border.default',
              mt: '4',
            }}
          >
            <Text variant="h6" css={{ fontWeight: 'semiBold' }}>
              Failed to Go Live
            </Text>
          </Dialog.Title>
          <Text variant="sm" css={{ mb: '10', color: 'onSurface.medium' }}>
            Something went wrong and your live broadcast failed. Please try again.
          </Text>
          <Flex align="center" justify="between" css={{ w: '100%', gap: '8' }}>
            <Button outlined variant="standard" css={{ w: '100%' }} onClick={() => setOpenModal(false)}>
              Dismiss
            </Button>
            <Button css={{ w: '100%' }} onClick={startHLS}>
              Go Live
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ) : null;
}
