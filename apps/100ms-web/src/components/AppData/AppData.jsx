import {
  selectIsConnectedToRoom,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { useEffect } from "react";
import { APP_DATA, UI_SETTINGS } from "../../common/constants";
import { useSidepaneReset } from "./useSidepane";

export const getAppDetails = appDetails => {
  try {
    return !appDetails ? {} : JSON.parse(appDetails);
  } catch (error) {
    return {};
  }
};

export function AppData({ appDetails, recordingUrl }) {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const resetSidePane = useSidepaneReset();

  useEffect(() => {
    if (!isConnected) {
      resetSidePane();
    }
  }, [isConnected, resetSidePane]);

  useEffect(() => {
    const initialAppData = {
      [APP_DATA.uiSettings]: {
        [UI_SETTINGS.isAudioOnly]: false,
        [UI_SETTINGS.isHeadless]: false,
      },
      [APP_DATA.chatOpen]: false,
      [APP_DATA.chatDraft]: "",
      [APP_DATA.sidePane]: "",
      [APP_DATA.recordingUrl]: recordingUrl,
      [APP_DATA.appConfig]: getAppDetails(appDetails),
    };
    hmsActions.initAppData(initialAppData);
  }, [hmsActions, appDetails, recordingUrl]);

  return null;
}
