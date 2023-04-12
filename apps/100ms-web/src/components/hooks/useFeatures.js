import { selectTemplateAppData, useHMSStore } from "@100mslive/react-sdk";

export const useFeatures = key => {
  let features = useHMSStore(selectTemplateAppData)?.features;
  return features ? features.split(",").inclues(key) : undefined;
};

export const useIsFeatureEnabled = key => {
  let features = useFeatures();
  return features ? features.split(",").inclues(key) : true;
};
