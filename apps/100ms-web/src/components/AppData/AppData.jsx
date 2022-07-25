import { useEffect, useMemo } from "react";
import { useSearchParam } from "react-use";
import {
  selectAvailableRoleNames,
  selectIsConnectedToRoom,
  selectLocalPeerRoleName,
  selectRolesMap,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from "@100mslive/react-sdk";
import { useSidepaneReset, useSidepaneState } from "./useSidepane";
import {
  UserPreferencesKeys,
  useUserPreferences,
} from "../hooks/useUserPreferences";
import { useSetAppDataByKey } from "./useUISettings";
import { getMetadata } from "../../common/utils";
import { normalizeAppPolicyConfig } from "../init/initUtils";
import {
  APP_DATA,
  DEFAULT_HLS_ROLE_KEY,
  DEFAULT_HLS_VIEWER_ROLE,
  QUERY_PARAM_VIEW_MODE,
  SIDE_PANE_OPTIONS,
  UI_MODE_ACTIVE_SPEAKER,
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
export function AppData({
  appDetails,
  recordingUrl,
  logo,
  tokenEndpoint,
  policyConfig,
}) {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const sidePane = useSidepaneState();
  const resetSidePane = useSidepaneReset();
  const [preferences] = useUserPreferences(UserPreferencesKeys.UI_SETTINGS);
  const { subscribedNotifications = {}, ...uiSettings } = preferences || {};
  const roleNames = useHMSStore(selectAvailableRoleNames);
  const rolesMap = useHMSStore(selectRolesMap);
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const isDefaultModeActiveSpeaker =
    useSearchParam(QUERY_PARAM_VIEW_MODE) === UI_MODE_ACTIVE_SPEAKER;
  const appPolicyConfig = useMemo(
    () => normalizeAppPolicyConfig(roleNames, rolesMap, policyConfig),
    [roleNames, policyConfig, rolesMap]
  );

  useEffect(() => {
    if (localPeerRole) {
      hmsActions.setAppData(
        APP_DATA.appPolicyConfig,
        appPolicyConfig[localPeerRole]
      );
    }
  }, [localPeerRole, appPolicyConfig, hmsActions]);

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
        [UI_SETTINGS.showStatsOnTiles]: false,
        [UI_SETTINGS.enableAmbientMusic]: false,
        ...uiSettings,
        [UI_SETTINGS.uiViewMode]: isDefaultModeActiveSpeaker
          ? UI_MODE_ACTIVE_SPEAKER
          : uiSettings.uiViewMode || UI_MODE_GRID,
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
      [APP_DATA.hlsStarted]: false,
      [APP_DATA.rtmpStarted]: false,
      [APP_DATA.recordingUrl]: recordingUrl,
      [APP_DATA.tokenEndpoint]: tokenEndpoint,
      [APP_DATA.logo]: logo,
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
    tokenEndpoint,
    logo,
    policyConfig,
    isDefaultModeActiveSpeaker,
  ]);

  return <ResetStreamingStart />;
}

/**
 * reset hlsStarted, rtmpStarted values when streaming starts
 */
const ResetStreamingStart = () => {
  const { isHLSRunning, isRTMPRunning } = useRecordingStreaming();
  const [hlsStarted, setHLSStarted] = useSetAppDataByKey(APP_DATA.hlsStarted);
  const [rtmpStarted, setRTMPStarted] = useSetAppDataByKey(
    APP_DATA.rtmpStarted
  );

  useEffect(() => {
    if (isHLSRunning && hlsStarted) {
      setHLSStarted(false);
    }
  }, [isHLSRunning, hlsStarted, setHLSStarted]);
  useEffect(() => {
    if (isRTMPRunning && rtmpStarted) {
      setRTMPStarted(false);
    }
  }, [isRTMPRunning, setRTMPStarted, rtmpStarted]);
  return null;
};
