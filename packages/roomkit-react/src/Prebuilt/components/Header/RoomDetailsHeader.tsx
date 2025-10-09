import { useMedia } from 'react-use';
import { ChevronRightIcon } from '@100mslive/react-icons';
import { Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { config as cssConfig } from '../../../Theme';
import { useRoomLayoutHeader } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useSheetToggle } from '../AppData/useSheet';
// @ts-ignore
import { useSidepaneToggle } from '../AppData/useSidepane';
import { SHEET_OPTIONS, SIDE_PANE_OPTIONS } from '../../common/constants';

export const RoomDetailsHeader = () => {
  const { title, description } = useRoomLayoutHeader();
  const isMobile = useMedia(cssConfig.media.md);
  const clipLength = 30;
  const toggleDetailsPane = useSidepaneToggle(SIDE_PANE_OPTIONS.ROOM_DETAILS);
  const toggleDetailsSheet = useSheetToggle(SHEET_OPTIONS.ROOM_DETAILS);

  if ((!title && !description) || (isMobile && !title)) {
    return null;
  }

  return (
    <Flex direction={isMobile ? 'row' : 'column'} css={{ ml: '$8', alignItems: isMobile ? 'center' : 'start' }}>
      <Text variant="sm" css={{ c: '$on_surface_high', fontWeight: '$semiBold' }}>
        {title}
      </Text>
      {!isMobile && (
        <Flex align="end" css={{ color: '$on_surface_high' }}>
          <Text variant="xs" css={{ c: '$on_surface_medium' }}>
            {description.slice(0, clipLength)}
          </Text>
          {description.length > clipLength ? (
            <span
              style={{ fontWeight: '600', fontSize: '12px', cursor: 'pointer', lineHeight: '1rem' }}
              onClick={toggleDetailsPane}
            >
              &nbsp;...more
            </span>
          ) : null}
        </Flex>
      )}
      {isMobile && description ? (
        <Flex css={{ color: '$on_surface_medium' }}>
          <ChevronRightIcon height={16} width={16} onClick={toggleDetailsSheet} />
        </Flex>
      ) : null}
    </Flex>
  );
};
