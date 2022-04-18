import { useHMSActions } from "@100mslive/react-sdk";
import { useEffect } from "react";

export function CustomUISettings() {
  const hmsActions = useHMSActions();
  useEffect(() => {
    const initialCustomUISettings = {
      isAudioOnly: false,
    };
    hmsActions.setCustomUISettings(initialCustomUISettings);
  }, [hmsActions]);
  
  return null;
}
