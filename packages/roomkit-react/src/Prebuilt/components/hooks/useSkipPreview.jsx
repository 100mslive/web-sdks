import { useEffect } from "react";
import { useSearchParam } from "react-use";
import {
  QUERY_PARAM_SKIP_PREVIEW,
  QUERY_PARAM_SKIP_PREVIEW_HEADFUL,
  UI_SETTINGS,
} from "../../common/constants";
import { useSetUiSettings } from "../AppData/useUISettings";

export const useSkipPreview = () => {
  // way to skip preview for automated tests, beam recording and streaming
  const beamInToken = useSearchParam("token") === "beam_recording"; // old format to remove
  // use this field to join directly for quick testing while in local
  const directJoinHeadfulFromEnv =
    process.env.REACT_APP_HEADLESS_JOIN === "true";
  const directJoinHeadful =
    useSearchParam(QUERY_PARAM_SKIP_PREVIEW_HEADFUL) === "true" ||
    directJoinHeadfulFromEnv;
  let skipPreview = useSearchParam(QUERY_PARAM_SKIP_PREVIEW) === "true";
  skipPreview = skipPreview || beamInToken || directJoinHeadful;
  const [, setIsHeadless] = useSetUiSettings(UI_SETTINGS.isHeadless);
  useEffect(() => {
    !directJoinHeadful && setIsHeadless(skipPreview);
  }, [directJoinHeadful, skipPreview]); //eslint-disable-line

  return skipPreview;
};
