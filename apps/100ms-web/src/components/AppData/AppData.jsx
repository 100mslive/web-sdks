import { useEffect } from "react";
import {
  selectIsConnectedToRoom,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { useSidepaneReset, useSidepaneState } from "./useSidepane";
import {
  UserPreferencesKeys,
  useUserPreferences,
} from "../hooks/useUserPreferences";
import { getMetadata } from "../../common/utils";
import {
  APP_DATA,
  DEFAULT_HLS_ROLE_KEY,
  DEFAULT_HLS_VIEWER_ROLE,
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

let initCalled = false;
export function AppData({ appDetails, recordingUrl }) {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const sidePane = useSidepaneState();
  const resetSidePane = useSidepaneReset();
  const [preferences] = useUserPreferences(UserPreferencesKeys.UI_SETTINGS);
  const { subscribedNotifications = {}, ...uiSettings } = preferences || {};

  useEffect(() => {
    if (
      !isConnected &&
      sidePane &&
      sidePane !== SIDE_PANE_OPTIONS.PARTICIPANTS
    ) {
      resetSidePane();
    }
  }, [isConnected, sidePane, resetSidePane]);

  useEffect(() => {
    if (initCalled) {
      return;
    }
    const initialAppData = {
      [APP_DATA.uiSettings]: {
        [UI_SETTINGS.isAudioOnly]: false,
        [UI_SETTINGS.isHeadless]: false,
        [UI_SETTINGS.maxTileCount]: 9,
        [UI_SETTINGS.uiViewMode]: UI_MODE_GRID,
        [UI_SETTINGS.showStatsOnTiles]: false,
        [UI_SETTINGS.enableAmbientMusic]: false,
        ...uiSettings,
      },
      [APP_DATA.subscribedNotifications]: {
        PEER_JOINED: false,
        PEER_LEFT: false,
        NEW_MESSAGE: true,
        ERROR: true,
        METADATA_UPDATED: true,
        ...subscribedNotifications,
      },
      [APP_DATA.chatOpen]: false,
      [APP_DATA.chatDraft]: "",
      [APP_DATA.sidePane]: "",
      [APP_DATA.recordingUrl]: recordingUrl,
      [APP_DATA.hlsViewerRole]:
        getMetadata(appDetails)[DEFAULT_HLS_ROLE_KEY] ||
        DEFAULT_HLS_VIEWER_ROLE,
      [APP_DATA.appConfig]: getAppDetails(appDetails),
    };
    hmsActions.initAppData(initialAppData);
    initCalled = true;
  }, [
    appDetails,
    hmsActions,
    recordingUrl,
    subscribedNotifications,
    uiSettings,
  ]);

  return null;
}
