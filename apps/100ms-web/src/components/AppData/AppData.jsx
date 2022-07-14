import { useEffect } from "react";
import {
  selectIsConnectedToRoom,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { useSidepaneReset, useSidepaneState } from "./useSidepane";
import {
  APP_DATA,
  SIDE_PANE_OPTIONS,
  UI_MODE_GRID,
  UI_SETTINGS,
} from "../../common/constants";

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
  const sidePane = useSidepaneState();
  const resetSidePane = useSidepaneReset();

  useEffect(() => {
    if (!isConnected && sidePane !== SIDE_PANE_OPTIONS.PARTICIPANTS) {
      resetSidePane();
    }
  }, [isConnected, sidePane, resetSidePane]);

  useEffect(() => {
    const initialAppData = {
      [APP_DATA.uiSettings]: {
        [UI_SETTINGS.isAudioOnly]: false,
        [UI_SETTINGS.isHeadless]: false,
        [UI_SETTINGS.maxTileCount]: 9,
        maxTileCount: 9,
        uiViewMode: UI_MODE_GRID,
        showStatsOnTiles: false,
        enableAmbientMusic: false,
      },
      [APP_DATA.subscribedNotifications]: {
        PEER_JOINED: false,
        PEER_LEFT: false,
        NEW_MESSAGE: true,
        ERROR: true,
        METADATA_UPDATED: true,
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
