import { selectAppDataByPath, useHMSStore } from "@100mslive/react-sdk";
import { getPath } from "./useUISettings";
import { APP_DATA } from "../../common/constants";

export const useAppPolicyConfig = path => {
  return useHMSStore(
    selectAppDataByPath(getPath({ base: APP_DATA.appPolicyConfig, path }))
  );
};
