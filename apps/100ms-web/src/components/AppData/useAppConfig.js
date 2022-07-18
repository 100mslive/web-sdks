import get from "lodash.get";
import { selectAppData, useHMSStore } from "@100mslive/react-sdk";
import { APP_DATA } from "../../common/constants";

export const useAppConfig = () => {
  const appConfig = useHMSStore(selectAppData(APP_DATA.appConfig));
  return appConfig;
};

export const useAppConfigByPath = path => {
  const appConfig = useAppConfig();
  return get(appConfig, path);
};
