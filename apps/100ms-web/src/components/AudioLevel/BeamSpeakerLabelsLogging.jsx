import { useEffect } from "react";
import { useHMSActions } from "@100mslive/react-sdk";
import { useIsHeadless } from "../AppData/useUISettings";

export function BeamSpeakerLabelsLogging() {
  const hmsActions = useHMSActions();
  const isHeadless = useIsHeadless();

  useEffect(() => {
    if (!isHeadless) {
      hmsActions.enableBeamSpeakerLabelsLogging();
    }
  }, [hmsActions, isHeadless]);
  return null;
}
