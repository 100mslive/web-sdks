import React, { useEffect, useRef, useState } from 'react';
import { CrossIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { getUpdatedHeight } from '../../common/utils';
import { Dialog } from '../../../Modal';

export const BottomActionSheet = ({
  title = '',
  triggerContent,
  containerCSS = {},
  sheetOpen = false,
  setSheetOpen,
  sideOffset = -50,
  defaultHeight = 50,
  children,
}) => {
  const MINIMUM_HEIGHT = 40; // vh
  const [sheetHeight, setSheetHeight] = useState(`${Math.min(Math.max(MINIMUM_HEIGHT, defaultHeight), 100)}vh`);
  const closeRef = useRef(null);

  // Close the sheet if height goes under MINIMUM_HEIGHT
  useEffect(() => {
    if (closeRef?.current && parseFloat(sheetHeight.slice(0, -2)) <= MINIMUM_HEIGHT) {
      setSheetOpen(false);
      closeRef.current?.click();
    }
  }, [setSheetOpen, sheetHeight]);

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{triggerContent}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          sideOffset={sideOffset}
          css={{
            position: 'fixed',
            bottom: '0',
            top: 'unset',
            transform: 'translate(-50%)',
            transition: '0',
            '&[data-state="open"]': {
              animation: 'none',
            },
            '&[data-state="closed"]': {
              animation: 'none',
            },
          }}
        >
          <Box
            css={{
              w: '100vw',
              py: '$8',
              opacity: sheetOpen ? '1' : '0.5',
              h: sheetHeight,
              minHeight: '50vh',
              overflowY: 'auto',
              backgroundColor: '$surface_default',
              transition: 'none',
              ...containerCSS,
            }}
          >
            <Flex
              justify="between"
              onTouchMove={e => {
                const updatedSheetHeight = getUpdatedHeight(e, MINIMUM_HEIGHT);
                setSheetHeight(updatedSheetHeight);
              }}
              css={{
                borderBottom: '1px solid $border_bright',
                px: '$8',
                pb: '$4',
                mb: '$4',
                w: '100%',
              }}
            >
              <Text variant="h6" css={{ color: '$on_surface_high' }}>
                {title}
              </Text>
              <Dialog.Close aria-label="Close">
                <Box
                  ref={closeRef}
                  css={{
                    color: '$on_surface_high',
                    bg: '$surface_bright',
                    p: '$2',
                    borderRadius: '$round',
                  }}
                >
                  <CrossIcon />
                </Box>
              </Dialog.Close>
            </Flex>
            <Box css={{ px: '$8', maxHeight: '100%', overflowY: 'auto' }}>{children}</Box>
          </Box>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
