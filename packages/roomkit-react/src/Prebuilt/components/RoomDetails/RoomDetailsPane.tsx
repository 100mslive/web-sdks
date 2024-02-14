import React from 'react';
import { CrossIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { Duration } from './Duration';
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

      <Flex align="center" css={{ w: '100%', mt: '$4', borderBottom: '1px solid $border_bright', pb: '$10' }}>
        {details.map((detail, index) => (
          <React.Fragment key={detail.toString()}>
            {index > 0 && <Box css={{ h: '$2', w: '$2', r: '$round', bg: '$on_surface_medium', m: '0 $2' }} />}
            {typeof detail !== 'string' ? (
              <Duration timeStamp={detail} />
            ) : (
              <Text variant="xs" css={{ c: '$on_surface_medium' }}>
                {detail}
              </Text>
            )}
          </React.Fragment>
        ))}
      </Flex>

      <Box css={{ mt: '$10' }}>
        <Text css={{ color: '$on_surface_high', fontWeight: '$semiBold' }}>Description</Text>
        <Text variant="sm" css={{ c: '$on_surface_medium' }}>
          {description}
        </Text>
      </Box>
    </Box>
  );
};
