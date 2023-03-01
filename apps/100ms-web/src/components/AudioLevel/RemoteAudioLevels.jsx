import { useEffect } from "react";
import { useHMSActions, useHMSVanillaStore } from "@100mslive/react-sdk";
import { remoteAudioLevels } from "./audioLevel";

export function RemoteAudioLevels() {
  const hmsActions = useHMSActions();
  const vanillaStore = useHMSVanillaStore();

  useEffect(() => {
    console.log("setting store actions");
    remoteAudioLevels.setStoreActions(vanillaStore, hmsActions);
    remoteAudioLevels.start();
    return () => {
      remoteAudioLevels.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
