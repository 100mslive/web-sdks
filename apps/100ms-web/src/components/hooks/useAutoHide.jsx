import {
  selectAppData,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { APP_DATA } from "../../common/constants";

export const useAutoHide = () => {
  const hmsActions = useHMSActions();
  const autoHideControlsAfter = useHMSStore(
    selectAppData(APP_DATA.autoHideControlsAfter)
  );
  const autoHide = open => {
    hmsActions.setAppData(APP_DATA.autoHideControlsAfter, open ? null : 5000);
    if (open && autoHideControlsAfter !== null) {
      hmsActions.setAppData(APP_DATA.autoHideControlsAfter, null);
    }
  };
  return autoHide;
};
