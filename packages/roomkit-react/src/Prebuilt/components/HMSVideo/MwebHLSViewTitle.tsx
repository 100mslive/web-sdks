import React from 'react';
import { ChevronDownIcon } from '@100mslive/react-icons';
import { Flex } from '../../../Layout';
import { Text } from '../../../Text';
// @ts-ignore: No implicit any
import { Logo } from '../Header/HeaderComponents';
import { RoomDetailsRow } from '../RoomDetails/RoomDetailsRow';
import { useRoomLayoutHeader } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore
import { useIsSidepaneTypeOpen, useSidepaneToggle } from '../AppData/useSidepane';
import { SIDE_PANE_OPTIONS } from '../../common/constants';

/*
	player handler --> left -> go live with timer or live, right -> expand icon 
	inbetween -> play pause icon, double tap to go back/forward
	seekbar
	half page will have chat or participant view
*/
export const HLSViewTitle = () => {
  const { title, details, description } = useRoomLayoutHeader();
  const toggleDetailsPane = useSidepaneToggle(SIDE_PANE_OPTIONS.ROOM_DETAILS);
  const isDetailSidepaneOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.ROOM_DETAILS);

  if (isDetailSidepaneOpen) {
    return (
      <Flex
        gap="4"
        align="center"
        justify="between"
        css={{
          position: 'relative',
          h: 'fit-content',
          w: '100%',
          borderBottom: '1px solid $border_bright',
          p: '8',
          backgroundColor: 'surface.dim',
        }}
      >
        <Text variant="sub2" css={{ fontWeight: '$semiBold' }}>
          About Session
        </Text>
        <Flex
          onClick={toggleDetailsPane}
          css={{
            color: 'onSurface.high',
            cursor: 'pointer',
            '&:hover': { opacity: '0.8' },
          }}
        >
          <ChevronDownIcon />
        </Flex>
      </Flex>
    );
  }
  return (
    <Flex
      gap="4"
      align="center"
      css={{
        position: 'relative',
        h: 'fit-content',
        w: '100%',
        borderBottom: '1px solid $border_bright',
        p: '8',
        backgroundColor: 'surface.dim',
      }}
    >
      <Logo />
      <Flex direction="column">
        {title ? (
          <Text variant="sub2" css={{ fontWeight: '$semiBold' }}>
            {title}
          </Text>
        ) : null}
        <Flex>
          <RoomDetailsRow details={details} />
          {description ? (
            <Text variant="caption" css={{ color: 'onSurface.medium' }} onClick={toggleDetailsPane}>
              &nbsp;...more
            </Text>
          ) : null}
        </Flex>
      </Flex>
    </Flex>
  );
};
