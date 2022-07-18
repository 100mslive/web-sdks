import { selectAppData, useHMSStore } from "@100mslive/react-sdk";
import { APP_DATA } from "../../common/constants";

export const useAppPolicyConfig = path => {
  return useHMSStore(selectAppData(`${APP_DATA.appPolicyConfig}.${path}`));
};
