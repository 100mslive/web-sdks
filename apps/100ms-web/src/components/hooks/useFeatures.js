import { selectTemplateAppData, useHMSStore } from "@100mslive/react-sdk";

export const useFeatures = key => {
  let features = useHMSStore(selectTemplateAppData)?.features;
  return features ? features.split(",") : undefined;
};

export const useIsFeatureEnabled = key => {
  let features = useFeatures();
  return features ? features.includes(key) : true;
};

export const useRolePreference = () => {
  let preference = useHMSStore(selectTemplateAppData)?.rolePreference;
  console.log(preference);
  try {
    preference = JSON.parse(preference || "{}");
  } catch (e) {
    console.log("role preference parse error", e);
  }
  return preference;
};
