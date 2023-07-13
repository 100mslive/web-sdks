import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Cross2Icon } from '@radix-ui/react-icons';
import * as Popover from '@radix-ui/react-popover';
import { Box, Flex } from '../Layout';
import { Text } from '../Text';
import { CSS } from '../Theme';
import { getUpdatedHeight } from '../utils/helpers';

export const BottomSheet = ({
  title = '',
  children = <></>,
  triggerContent,
  containerCSS = {},
  sideOffset = -50,
}: {
  title: string;
  children: ReactNode;
  triggerContent: ReactNode;
  containerCSS: CSS;
  // By default the component starts just above the trigger.
  // A negative offset allows it to start from the bottom of the screen.
  sideOffset: number;
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetHeight, setSheetHeight] = useState('50vh');
  const closeRef = useRef<HTMLDivElement>(null);

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
                    <Cross2Icon />
                  </Box>
                </Popover.Close>
              </Flex>
              <Box css={{ px: '$8' }}>{children}</Box>
            </Box>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
};
