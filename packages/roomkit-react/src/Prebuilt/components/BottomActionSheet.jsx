import React, { useEffect, useRef, useState } from 'react';
import { CrossIcon } from '@100mslive/react-icons';
import { Box, Flex, Popover, Text } from '../../';
import { getUpdatedHeight } from '../common/utils';

export const BottomSheet = ({
  title = '',
  children = <></>,
  triggerContent,
  containerCSS = {},
  // By default the component starts just above the trigger.
  // A negative offset allows it to start from the bottom of the screen.
  sideOffset = -50,
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetHeight, setSheetHeight] = useState('50vh');
  const closeRef = useRef < HTMLDivElement > null;

  // Close the sheet if height goes under 40vh
  useEffect(() => {
    if (closeRef?.current && parseFloat(sheetHeight.slice(0, -2)) <= 40) {
      setSheetOpen(false);
      // Delay for showing the opacity animation, can be removed if not needed
      setTimeout(() => closeRef.current?.click(), 200);
    }
  }, [sheetHeight]);

  return (
    <>
      <Popover.Root
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
                backgroundColor: '$surfaceDefault',
                transition: 'all 0.2s linear',
                ...containerCSS,
              }}
            >
              <Flex
                justify="between"
                onTouchMove={e => {
                  const updatedSheetHeight = getUpdatedHeight(e);
                  setSheetHeight(updatedSheetHeight);
                }}
                css={{
                  borderBottom: '1px solid $borderLight',
                  px: '$8',
                  pb: '$4',
                  mb: '$4',
                  w: '100%',
                }}
              >
                <Text variant="h6" css={{ color: '$textHighEmp' }}>
                  {title}
                </Text>
                <Popover.Close aria-label="Close">
                  <Box
                    ref={closeRef}
                    css={{
                      color: '$textHighEmp',
                      bg: '$surfaceLight',
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
    </>
  );
};
