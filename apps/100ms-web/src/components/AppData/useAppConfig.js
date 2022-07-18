import { selectAppDataByPath, useHMSStore } from "@100mslive/react-sdk";
import { getPath } from "./useUISettings";
import { APP_DATA } from "../../common/constants";

export const useAppConfig = path => {
  const appConfig = useHMSStore(
    selectAppDataByPath(getPath({ base: APP_DATA.appConfig, path }))
  );
  return appConfig;
};

export const useTileOffset = () => {
  const offset = useHMSStore(
    selectAppDataByPath([APP_DATA.appConfig, "headlessConfig", "tileOffset"])
  );
  return offset;
};
