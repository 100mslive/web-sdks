import React, { useState, useCallback } from 'react';
import { Button } from '../../../Button';
import { Dialog } from '../../../Modal';
import { Text } from '../../../Text';
import { Flex } from '../../../Layout';
import { useSetAppDataByKey } from '../AppData/useUISettings';
import { APP_DATA } from '../../common/constants';
import { useHMSActions } from '@100mslive/react-sdk';

export function HLSFailureModal() {
  //   const { hlsError = null } = useHMSStore(selectHLSState).error;
  const hlsError = true;
  const [openModal, setOpenModal] = useState(!!hlsError);
  const hmsActions = useHMSActions();
  const [isHLSStarted, setHLSStarted] = useSetAppDataByKey(APP_DATA.hlsStarted);
  const startHLS = useCallback(async () => {
    try {
      if (isHLSStarted) {
        return;
      }
      setHLSStarted(true);
      await hmsActions.startHLSStreaming({});
    } catch (error) {
      if (error.message.includes('invalid input')) {
        await startHLS();
        return;
      }
      setHLSStarted(false);
    }
  }, [hmsActions, isHLSStarted, setHLSStarted]);

  return hlsError ? (
    <Dialog.Root
      open={openModal}
      onOpenChange={value => {
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
              borderBottom: '1px solid $borderDefault',
              mt: '$4',
            }}
          >
            <Text variant="h6" css={{ fontWeight: '$semiBold' }}>
              Failed to Go Live
            </Text>
          </Dialog.Title>
          <Text variant="sm" css={{ mb: '$10', color: '$textMedEmp' }}>
            Something went wrong and your live broadcast failed. Please try again.
          </Text>
          <Flex align="center" justify="between" css={{ w: '100%', gap: '$8' }}>
            <Button outlined variant="standard" css={{ w: '100%' }} onClick={() => setOpenModal(false)}>
              Dismiss
            </Button>
            <Button css={{ w: '100%' }}>Go Live</Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ) : null;
}
