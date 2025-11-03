import { selectAppData, useHMSStore } from '@100mslive/react-sdk';
import { RoomDetailsSheet } from '../components/RoomDetails/RoomDetailsSheet';
import { Box } from '../../Layout';
import { APP_DATA, SHEET_OPTIONS } from '../common/constants';

export const Sheet = () => {
  const sheet = useHMSStore(selectAppData(APP_DATA.sheet));
  let ViewComponent;
  if (sheet === SHEET_OPTIONS.ROOM_DETAILS) {
    ViewComponent = <RoomDetailsSheet />;
  }
  return <Box>{ViewComponent}</Box>;
};
