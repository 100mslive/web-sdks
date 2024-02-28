import React from 'react';
import { CrossIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
// @ts-ignore: No implicit any
import { Logo } from '../Header/HeaderComponents';
// @ts-ignore
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
    <Box css={{ flex: '1 1 0' }}>
      {isMwebHLSStream ? (
        <Flex direction="row" align="center" gap="2">
          <Logo />
          <Flex direction="column">
            <ShowRoomDetailHeader />
          </Flex>
        </Flex>
      ) : (
        <ShowRoomDetailHeader />
      )}
      <Box css={{ mt: '$10' }}>
        <Text css={{ color: '$on_surface_high', fontWeight: '$semiBold', display: isMwebHLSStream ? 'none' : '' }}>
          Description
        </Text>
        <Text variant="sm" css={{ c: '$on_surface_medium' }}>
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
    <>
      <Flex justify="between" align="center" css={{ w: '100%' }}>
        <Text variant="h6">{title}</Text>
        <Flex
          onClick={toggleDetailsPane}
          css={{
            color: '$on_surface_high',
            cursor: 'pointer',
            '&:hover': { opacity: '0.8' },
            display: isMwebHLSStream ? 'none' : '',
          }}
        >
          <CrossIcon />
        </Flex>
      </Flex>
      <RoomDetailsRow details={details} />
    </>
  );
};
