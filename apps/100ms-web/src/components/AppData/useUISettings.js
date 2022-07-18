import { APP_DATA, UI_SETTINGS } from "../../common/constants";
import {
  selectAppData,
  selectAppDataByPath,
  useHMSActions,
  useHMSStore,
  useHMSVanillaStore,
} from "@100mslive/react-sdk";
import { useCallback } from "react";
import {
  UserPreferencesKeys,
  useUserPreferences,
} from "../hooks/useUserPreferences";

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
  const selectorPath = getPath({
    base: APP_DATA.uiSettings,
    path: uiSettingKey,
  });
  const uiSettings = useHMSStore(selectAppDataByPath(selectorPath));
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

export const useHLSViewerRole = () => {
  return useHMSStore(selectAppData(APP_DATA.hlsViewerRole));
};

export const useTokenEndpoint = () => {
  return useHMSStore(selectAppData(APP_DATA.tokenEndpoint));
};

export const useLogo = () => {
  return useHMSStore(selectAppData(APP_DATA.logo));
};

export const useSubscribedNotifications = notificationKey => {
  const selectorPath = getPath({
    base: APP_DATA.subscribedNotifications,
    path: notificationKey,
  });
  const notificationPreference = useHMSStore(selectAppDataByPath(selectorPath));
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

const useSetAppData = ({ key1, key2 }) => {
  const actions = useHMSActions();
  const store = useHMSVanillaStore();
  const [, setPreferences] = useUserPreferences(
    UserPreferencesKeys.UI_SETTINGS
  );
  const setValue = useCallback(
    (value, type) => {
      if (!key1 || (!key2 && !type)) {
        return;
      }
      actions.setAppData(
        key1,
        {
          [key2 || type]: value,
        },
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

export const getPath = ({ base, path }) => {
  let selectorPath = [base];
  if (path) {
    selectorPath = selectorPath.concat(path);
  }
  return selectorPath;
};
