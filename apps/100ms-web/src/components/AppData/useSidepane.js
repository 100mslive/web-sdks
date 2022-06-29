import {
  selectAppData,
  useHMSActions,
  useHMSStore,
  useHMSVanillaStore,
} from "@100mslive/react-sdk";
import { useCallback } from "react";
import { APP_DATA } from "../../common/constants";

export const useSidepaneState = () => {
  const sidepane = useHMSStore(selectAppData(APP_DATA.sidePane));
  return sidepane;
};

export const useSidepaneToggle = option => {
  const hmsActions = useHMSActions();
  const vanillaStore = useHMSVanillaStore();
  const toggleSidepane = useCallback(() => {
    const isOpen =
      vanillaStore.getState(selectAppData(APP_DATA.sidePane)) === option;
    hmsActions.setAppData(APP_DATA.sidePane, !isOpen ? option : "", true);
  }, [vanillaStore, hmsActions, option]);
  return toggleSidepane;
};
