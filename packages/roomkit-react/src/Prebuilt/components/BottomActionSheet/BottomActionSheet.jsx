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
  console.log('here ', sheetOpen);

  // Close the sheet if height goes under MINIMUM_HEIGHT
  useEffect(() => {
    if (closeRef?.current && parseFloat(sheetHeight.slice(0, -2)) <= MINIMUM_HEIGHT) {
      setSheetOpen(false);
      // Delay for showing the opacity animation, can be removed if not needed
      setTimeout(() => closeRef.current?.click(), 200);
    }
  }, [setSheetOpen, sheetHeight]);

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{triggerContent}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content sideOffset={sideOffset} style={{ zIndex: '2' }}>
          <Box
            css={{
              w: '100vw',
              py: '$8',
              opacity: sheetOpen ? '1' : '0.5',
              h: sheetHeight,
              minHeight: '50vh',
              overflowY: 'auto',
              backgroundColor: '$surface_default',
              transition: 'all 0.2s linear',
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
    /*
    <Dialog.Root
      open={sheetOpen}
      onOpenChange={open => {
        if (!open) {
          setSheetHeight('0');
        }
        setSheetOpen(open);
      }}
    >
      <Dialog.Trigger asChild>{triggerContent}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content sideOffset={sideOffset} style={{ zIndex: '2' }}>
          <Box
            css={{
              w: '100vw',
              py: '$8',
              opacity: sheetOpen ? '1' : '0.5',
              h: sheetHeight,
              minHeight: '50vh',
              overflowY: 'auto',
              backgroundColor: '$surface_default',
              transition: 'all 0.2s linear',
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
    */
    /*
    <Popover.Root
      open={sheetOpen}
      onOpenChange={open => {
        if (!open) {
          setSheetHeight('0');
        }
        setSheetOpen(open);
      }}
    >
      <Popover.Trigger asChild>{triggerContent}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={sideOffset} style={{ zIndex: '2' }}>
          <Box
            css={{
              w: '100vw',
              py: '$8',
              opacity: sheetOpen ? '1' : '0.5',
              h: sheetHeight,
              minHeight: '50vh',
              overflowY: 'auto',
              backgroundColor: '$surface_default',
              transition: 'all 0.2s linear',
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
              <Popover.Close aria-label="Close">
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
              </Popover.Close>
            </Flex>
            <Box css={{ px: '$8', maxHeight: '100%', overflowY: 'auto' }}>{children}</Box>
          </Box>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
    */
  );
};
