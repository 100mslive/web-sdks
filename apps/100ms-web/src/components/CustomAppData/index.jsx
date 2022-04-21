import { useHMSActions } from "@100mslive/react-sdk";
import { useEffect } from "react";

export function customAppData() {
  const hmsActions = useHMSActions();
  useEffect(() => {
    const initialcustomAppData = {
      isAudioOnly: false,
    };
    hmsActions.setCustomAppData(initialcustomAppData);
  }, [hmsActions]);

  return null;
}
