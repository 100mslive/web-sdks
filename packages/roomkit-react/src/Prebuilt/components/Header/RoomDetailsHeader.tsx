import React, { useState } from 'react';
import { useMedia } from 'react-use';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { config as cssConfig } from '../../../Theme';
import { RoomDetailsSheet } from '../RoomDetails/RoomDetailsSheet';
import { useRoomLayoutHeader } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore
import { useSidepaneToggle } from '../AppData/useSidepane';
import { SIDE_PANE_OPTIONS } from '../../common/constants';

export const RoomDetailsHeader = () => {
  const { title, description } = useRoomLayoutHeader();
  const isMobile = useMedia(cssConfig.media.md);
  const clipLength = isMobile ? 8 : 100;
  const toggleDetailsPane = useSidepaneToggle(SIDE_PANE_OPTIONS.ROOM_DETAILS);
  const [openDetailsSheet, setOpenDetailsSheet] = useState(false);

  if (!title && !description) {
    return null;
  }

  return (
    <Box css={{ ml: '$9' }}>
      <Text variant="sm" css={{ c: '$on_surface_high', fontWeight: '$semiBold' }}>
        {title}
      </Text>
      <Flex align="end" css={{ color: '$on_surface_high' }}>
        <Text variant="xs" css={{ c: '$on_surface_medium' }}>
          {description.slice(0, clipLength)}
        </Text>
        {description.length > clipLength ? (
          <span
            style={{ fontWeight: '600', fontSize: '12px', cursor: 'pointer', lineHeight: '1rem' }}
            onClick={() => {
              if (isMobile) {
                setOpenDetailsSheet(true);
                return;
              }
              toggleDetailsPane();
            }}
          >
            &nbsp;...more
          </span>
        ) : null}
      </Flex>
      {openDetailsSheet && <RoomDetailsSheet open={openDetailsSheet} onOpenChange={setOpenDetailsSheet} />}
    </Box>
  );
};
