import React from 'react';
import { CrossIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';
import { Sheet } from '../../../Sheet';
import { Text } from '../../../Text';
// @ts-ignore
import { Logo } from '../Header/HeaderComponents';
import { RoomDetailsRow } from './RoomDetailsRow';
import { useRoomLayoutHeader } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
export const RoomDetailsSheet = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { title, description, details } = useRoomLayoutHeader();
  return (
    <Sheet.Root open={open} onOpenChange={onOpenChange}>
      <Sheet.Content css={{ py: '$8', pb: '$12' }}>
        <Flex
          justify="between"
          align="center"
          css={{ w: '100%', borderBottom: '1px solid $border_bright', pb: '$4', mb: '$4', px: '$8' }}
        >
          <Text css={{ fontWeight: '$semiBold', color: '$on_surface_high' }}>Description</Text>
          <Sheet.Close css={{ color: '$on_surface_high' }}>
            <CrossIcon />
          </Sheet.Close>
        </Flex>
        <Flex align="center" css={{ w: '100%', gap: '$4', pb: '$8', px: '$8' }}>
          <Logo />
          <Box>
            <Text variant="sm" css={{ c: '$on_secondary_high', fontWeight: '$semiBold' }}>
              {title}
            </Text>
            <RoomDetailsRow details={details} />
          </Box>
        </Flex>
        <Text variant="sm" css={{ color: '$on_surface_medium', px: '$8' }}>
          {description}
        </Text>
      </Sheet.Content>
    </Sheet.Root>
  );
};
