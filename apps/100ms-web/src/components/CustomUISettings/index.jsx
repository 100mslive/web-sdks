import { useHMSActions } from "@100mslive/react-sdk";
import { useEffect } from "react";

export function AppData() {
  const hmsActions = useHMSActions();
  useEffect(() => {
    const initialAppData = {
      isAudioOnly: false,
    };
    hmsActions.setAppData(initialAppData);
  }, [hmsActions]);
  
  return null;
}
