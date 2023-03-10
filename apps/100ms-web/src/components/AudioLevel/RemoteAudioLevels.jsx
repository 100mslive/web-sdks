import { useEffect } from "react";
import { useHMSActions } from "@100mslive/react-sdk";

export function RemoteAudioLevels() {
  const hmsActions = useHMSActions();

  useEffect(() => {
    hmsActions.enableBeamSpeakerLabelsLogging();
  }, [hmsActions]);
  return null;
}
