import React from 'react';
import { CrossIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { RoomDetailsRow } from './RoomDetailsRow';
import { useRoomLayoutHeader } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore
import { useSidepaneToggle } from '../AppData/useSidepane';
import { SIDE_PANE_OPTIONS } from '../../common/constants';

export const RoomDetailsPane = () => {
  const { title, description, details } = useRoomLayoutHeader();
  const toggleDetailsPane = useSidepaneToggle(SIDE_PANE_OPTIONS.ROOM_DETAILS);
  return (
    <Box css={{ flex: '1 1 0' }}>
      <Flex justify="between" align="center" css={{ w: '100%' }}>
        <Text variant="h6">{title}</Text>
        <Flex
          onClick={toggleDetailsPane}
          css={{ color: '$on_surface_high', cursor: 'pointer', '&:hover': { opacity: '0.8' } }}
        >
          <CrossIcon />
        </Flex>
      </Flex>

      <RoomDetailsRow details={details} />

      <Box css={{ mt: '$10' }}>
        <Text css={{ color: '$on_surface_high', fontWeight: '$semiBold' }}>Description</Text>
        <Text variant="sm" css={{ c: '$on_surface_medium' }}>
          {description}
        </Text>
      </Box>
    </Box>
  );
};
