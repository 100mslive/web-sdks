import { APP_DATA, UI_SETTINGS } from "../../common/constants";
import {
  selectAppData,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { useCallback } from "react";

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
  const value = useHMSStore(selectAppData(APP_DATA.uiSettings));
  if (value) {
    return uiSettingKey ? value[uiSettingKey] : value;
  }
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
    appDataKey: APP_DATA.uiSettings,
    key: uiSettingKey,
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

export const useSubscribedNotifications = notificationKey => {
  const value = useHMSStore(selectAppData(APP_DATA.subscribedNotifications));
  if (value) {
    return notificationKey ? value[notificationKey] : value;
  }
};

export const useSetSubscribedNotifications = notificationKey => {
  const value = useSubscribedNotifications(notificationKey);
  const setValue = useSetAppData({
    appDataKey: APP_DATA.subscribedNotifications,
    key: notificationKey,
  });
  return [value, setValue];
};

const useSetAppData = ({ appDataKey, key }) => {
  const actions = useHMSActions();
  const setValue = useCallback(
    (value, type) => {
      if (!appDataKey || (!key && !type)) {
        return;
      }
      actions.setAppData(
        appDataKey,
        {
          [key || type]: value,
        },
        true
      );
    },
    [actions, appDataKey, key]
  );
  return setValue;
};
