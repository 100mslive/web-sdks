import { selectAppData, useHMSStore } from "@100mslive/react-sdk";
import { APP_DATA } from "../../common/constants";

export const useAppConfig = path => {
  const appConfig = useHMSStore(
    selectAppData(path ? `${APP_DATA.appConfig}.${path}` : APP_DATA.appConfig)
  );
  return appConfig;
};
