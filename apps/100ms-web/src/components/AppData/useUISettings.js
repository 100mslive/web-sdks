import { useCallback } from "react";
import {
  selectAppData,
  selectAppDataByPath,
  selectIsAllowedToPublish,
  selectLocalPeerRoleName,
  selectPermissions,
  selectPolls,
  selectSessionStore,
  selectTrackByID,
  useHMSActions,
  useHMSStore,
  useHMSVanillaStore,
} from "@100mslive/react-sdk";
import { useWhiteboardMetadata } from "../../plugins/whiteboard/useWhiteboardMetadata";
import { useIsFeatureEnabled } from "../hooks/useFeatures";
import {
  UserPreferencesKeys,
  useUserPreferences,
} from "../hooks/useUserPreferences";
import { isScreenshareSupported } from "../../common/utils";
import {
  APP_DATA,
  FEATURE_LIST,
  SESSION_STORE_KEY,
  UI_SETTINGS,
  WIDGET_STATE,
} from "../../common/constants";

/**
 * fields saved related to UI settings in store's app data can be
 * accessed using this hook. key is optional if not passed
 * the whole UI settings object is returned. Usage -
 * 1. val = useUiSettings("isAudioOnly");
 *    console.log(val); // false
 * 2. val = useUISettings();
 *    console.log(val); // {isAudioOnly: false}
 * @param {string | undefined} uiSettingKey
 */
export const useUISettings = uiSettingKey => {
  const uiSettings = useHMSStore(
    selectAppDataByPath(APP_DATA.uiSettings, uiSettingKey)
  );
  return uiSettings;
};

/**
 * fields saved related to UI settings in store's app data can be
 * accessed using this hook. key is optional if not passed
 * the whole UI settings object is returned. Usage -
 * [val, setVal] = useUiSettings("isAudioOnly");
 * console.log(val); // false
 * setVal(true);
 * @param {string} uiSettingKey
 */
export const useSetUiSettings = uiSettingKey => {
  const value = useUISettings(uiSettingKey);
  const setValue = useSetAppData({
    key1: APP_DATA.uiSettings,
    key2: uiSettingKey,
  });
  return [value, setValue];
};

export const useIsHeadless = () => {
  const isHeadless = useUISettings(UI_SETTINGS.isHeadless);
  return isHeadless;
};

export const useActiveSpeakerSorting = () => {
  const activeSpeakerSorting = useUISettings(UI_SETTINGS.activeSpeakerSorting);
  return activeSpeakerSorting;
};

export const useHLSViewerRole = () => {
  return useHMSStore(selectAppData(APP_DATA.hlsViewerRole));
};

export const useWaitingViewerRole = () => {
  return useHMSStore(selectAppData(APP_DATA.waitingViewerRole));
};
export const useIsHLSStartedFromUI = () => {
  return useHMSStore(selectAppData(APP_DATA.hlsStarted));
};

export const useIsRTMPStartedFromUI = () => {
  return useHMSStore(selectAppData(APP_DATA.rtmpStarted));
};

export const useTokenEndpoint = () => {
  return useHMSStore(selectAppData(APP_DATA.tokenEndpoint));
};

export const useLogo = () => {
  return useHMSStore(selectAppData(APP_DATA.logo));
};

export const useUrlToEmbed = () => {
  return useHMSStore(selectAppData(APP_DATA.embedConfig));
};

export const usePDFConfig = () => {
  return useHMSStore(selectAppData(APP_DATA.pdfConfig));
};
export const useResetPDFConfig = () => {
  const [, setPDFConfig] = useSetAppDataByKey(APP_DATA.pdfConfig);
  return useCallback(() => setPDFConfig(), [setPDFConfig]);
};
export const useResetEmbedConfig = () => {
  const [, setEmbedConfig] = useSetAppDataByKey(APP_DATA.embedConfig);
  return () => setEmbedConfig();
};
export const usePinnedTrack = () => {
  const pinnedTrackId = useHMSStore(selectAppData(APP_DATA.pinnedTrackId));
  const spotlightTrackId = useHMSStore(
    selectSessionStore(SESSION_STORE_KEY.SPOTLIGHT)
  );
  return useHMSStore(selectTrackByID(pinnedTrackId || spotlightTrackId));
};

export const useSubscribedNotifications = notificationKey => {
  const notificationPreference = useHMSStore(
    selectAppDataByPath(APP_DATA.subscribedNotifications, notificationKey)
  );
  return notificationPreference;
};

export const useSetSubscribedNotifications = notificationKey => {
  const value = useSubscribedNotifications(notificationKey);
  const setValue = useSetAppData({
    key1: APP_DATA.subscribedNotifications,
    key2: notificationKey,
  });
  return [value, setValue];
};

export const useSubscribeChatSelector = chatSelectorKey => {
  const chatSelectorPreference = useHMSStore(
    selectAppDataByPath(APP_DATA.chatSelector, chatSelectorKey)
  );
  return chatSelectorPreference;
};

export const useSetSubscribedChatSelector = chatSelectorKey => {
  const value = useSubscribeChatSelector(chatSelectorKey);
  const setValue = useSetAppData({
    key1: APP_DATA.chatSelector,
    key2: chatSelectorKey,
  });
  return [value, setValue];
};

export const useSetAppDataByKey = appDataKey => {
  const value = useHMSStore(selectAppData(appDataKey));
  const actions = useHMSActions();
  const setValue = useCallback(
    value => {
      actions.setAppData(appDataKey, value);
    },
    [actions, appDataKey]
  );
  return [value, setValue];
};

const useSetAppData = ({ key1, key2 }) => {
  const actions = useHMSActions();
  const store = useHMSVanillaStore();
  const [, setPreferences] = useUserPreferences(
    UserPreferencesKeys.UI_SETTINGS
  );
  const setValue = useCallback(
    value => {
      if (!key1) {
        return;
      }
      actions.setAppData(
        key1,
        key2
          ? {
              [key2]: value,
            }
          : value,
        true
      );
      const appData = store.getState(selectAppData());
      setPreferences({
        ...appData.uiSettings,
        subscribedNotifications: appData.subscribedNotifications,
      });
    },
    [actions, key1, key2, store, setPreferences]
  );
  return setValue;
};

export const useWidgetState = () => {
  const [widgetState, setWidgetState] = useSetAppDataByKey(
    APP_DATA.widgetState
  );

  const setWidgetView = useCallback(
    view => {
      setWidgetState({
        [WIDGET_STATE.pollInView]: widgetState?.pollInView,
        [WIDGET_STATE.view]: view,
      });
    },
    [widgetState?.pollInView, setWidgetState]
  );

  return {
    setWidgetState,
    setWidgetView,
    pollInView: widgetState?.pollInView,
    widgetView: widgetState?.view,
  };
};
export const useShowWhiteboard = () => {
  const { whiteboardEnabled } = useWhiteboardMetadata();
  const hlsViewerRole = useHLSViewerRole();
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const isWhiteboardFeatureEnabled = useIsFeatureEnabled(
    FEATURE_LIST.WHITEBOARD
  );
  const showWhiteboard = useCallback(() => {
    return !(
      !whiteboardEnabled ||
      hlsViewerRole === localPeerRole ||
      !isWhiteboardFeatureEnabled
    );
  }, [
    hlsViewerRole,
    isWhiteboardFeatureEnabled,
    localPeerRole,
    whiteboardEnabled,
  ]);
  return {
    showWhiteboard: showWhiteboard(),
  };
};
export const useShowAudioShare = () => {
  const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
  const isAudioShareFeatureEnabled = useIsFeatureEnabled(
    FEATURE_LIST.AUDIO_ONLY_SCREENSHARE
  );

  const showAudioShare = useCallback(() => {
    return !(
      !isAudioShareFeatureEnabled ||
      !isAllowedToPublish.screen ||
      !isScreenshareSupported()
    );
  }, [isAllowedToPublish.screen, isAudioShareFeatureEnabled]);

  return {
    showAudioShare: showAudioShare(),
  };
};
export const useShowPolls = () => {
  const permissions = useHMSStore(selectPermissions);
  const polls = useHMSStore(selectPolls)?.filter(
    poll => poll.state === "started" || poll.state === "stopped"
  );

  const showPolls = useCallback(() => {
    return (
      permissions?.pollWrite || (permissions?.pollRead && polls?.length > 0)
    );
  }, [permissions?.pollRead, permissions?.pollWrite, polls?.length]);

  return {
    showPolls: showPolls(),
  };
};
