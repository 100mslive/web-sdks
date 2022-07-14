import { selectAppData, useHMSStore } from "@100mslive/react-sdk";
import { APP_DATA } from "../../common/constants";

export const useAppPolicyConfig = () => {
  return useHMSStore(selectAppData(APP_DATA.appPolicyConfig));
};

export const useAppPolicyConfigByKey = key => {
  const appPolicyConfig = useAppPolicyConfig();
  return appPolicyConfig[key];
};
