import { useEffect } from 'react';
import { DefaultConferencingScreen_Elements } from '@100mslive/types-prebuilt';
import { selectAppData, useHMSStore } from '@100mslive/react-sdk';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore
import { useSidepaneReset } from './useSidepane';
import { APP_DATA, SIDE_PANE_OPTIONS } from '../../common/constants';

// Closes the sidepane if an element is removed from the layout via the customiser
export const useSidepaneResetOnLayoutUpdate = (
  layoutKey: keyof DefaultConferencingScreen_Elements,
  sidepaneOption: typeof SIDE_PANE_OPTIONS,
) => {
  const { elements } = useRoomLayoutConferencingScreen();
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));
  const resetSidePane = useSidepaneReset();
  useEffect(() => {
    if (sidepane === sidepaneOption && !elements?.[layoutKey]) {
      resetSidePane();
    }
  }, [elements, elements?.[layoutKey], resetSidePane, sidepane, layoutKey, sidepaneOption]);
};
