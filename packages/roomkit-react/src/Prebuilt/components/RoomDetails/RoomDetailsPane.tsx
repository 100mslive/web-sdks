import React from 'react';
import { CrossIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
// @ts-ignore: No implicit any
import { Logo } from '../Header/HeaderComponents';
import { RoomDetailsRow } from './RoomDetailsRow';
import { useRoomLayoutHeader } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore
import { useSidepaneToggle } from '../AppData/useSidepane';
import { useMobileHLSStream } from '../../common/hooks';
import { SIDE_PANE_OPTIONS } from '../../common/constants';

export const RoomDetailsPane = () => {
  const { description } = useRoomLayoutHeader();
  const isMwebHLSStream = useMobileHLSStream();
  return (
    <Box css={{ flex: '1 1 0', position: 'relative' }}>
      {isMwebHLSStream ? (
        <Flex direction="row" align="center" gap="2">
          <Logo />
          <ShowRoomDetailHeader />
        </Flex>
      ) : (
        <ShowRoomDetailHeader />
      )}
      <Box css={{ mt: '10' }}>
        <Text css={{ color: 'onSurface.high', fontWeight: '$semiBold', display: isMwebHLSStream ? 'none' : '' }}>
          Description
        </Text>
        <Text variant="sm" css={{ c: 'onSurface.medium' }}>
          {description}
        </Text>
      </Box>
    </Box>
  );
};

const ShowRoomDetailHeader = () => {
  const { title, details } = useRoomLayoutHeader();
  const toggleDetailsPane = useSidepaneToggle(SIDE_PANE_OPTIONS.ROOM_DETAILS);
  const isMwebHLSStream = useMobileHLSStream();
  return (
    <Flex direction="column" css={{ position: 'sticky', top: 0, bg: 'surface.dim' }}>
      <Flex justify="between" align="center" css={{ w: '100%' }}>
        <Text variant="h6">{title}</Text>
        {!isMwebHLSStream && (
          <Flex
            onClick={toggleDetailsPane}
            css={{
              color: 'onSurface.high',
              cursor: 'pointer',
              '&:hover': { opacity: '0.8' },
            }}
          >
            <CrossIcon />
          </Flex>
        )}
      </Flex>
      <RoomDetailsRow details={details} />
    </Flex>
  );
};
