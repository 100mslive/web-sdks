import {
  selectAppData,
  useHMSActions,
  useHMSStore,
  useHMSVanillaStore,
} from "@100mslive/react-sdk";
import { useCallback } from "react";
import { APP_DATA } from "../../common/constants";

/**
 * Gives a boolean value if the sidepaneType matches current sidepane value in store
 * @param {string} sidepaneType
 * @returns {boolean | string} - if the sidepaneType is passed returns boolean else the current value
 */
export const useSidepaneState = sidepaneType => {
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));
  return sidepaneType ? sidepane === sidepaneType : sidepane;
};

/**
 * Toggle the sidepane value between passed sidePaneType and '';
 * @param {string} sidepaneType
 */
export const useSidepaneToggle = sidepaneType => {
  const hmsActions = useHMSActions();
  const vanillaStore = useHMSVanillaStore();
  const toggleSidepane = useCallback(() => {
    const isOpen =
      vanillaStore.getState(selectAppData(APP_DATA.sidePane)) === sidepaneType;
    hmsActions.setAppData(APP_DATA.sidePane, !isOpen ? sidepaneType : "");
  }, [vanillaStore, hmsActions, sidepaneType]);
  return toggleSidepane;
};

/**
 * reset's the sidepane value
 */
export const useSidepaneReset = () => {
  const hmsActions = useHMSActions();
  const resetSidepane = useCallback(() => {
    hmsActions.setAppData(APP_DATA.sidePane, "");
  }, [hmsActions]);
  return resetSidepane;
};
