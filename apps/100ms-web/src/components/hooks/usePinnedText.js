import { useCallback } from "react";
import {
  selectSessionMetadata,
  useCustomEvent,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { ToastManager } from "../Toast/ToastManager";

export const usePinnedText = () => {
  const hmsActions = useHMSActions();
  const pinnedText = useHMSStore(selectSessionMetadata)?.pinnedText;

  const changeSessionMetadatalocally = newText => {
    if (newText !== pinnedText) {
      ToastManager.addToast({ title: "Pinned Text Changed" });
      hmsActions.setSessionMetadata({ pinnedText: newText }, true);
    }
  };

  const { sendEvent } = useCustomEvent({
    type: "pinned-text-change",
    onEvent: newText => changeSessionMetadatalocally(newText, true),
  });

  const changePinnedText = useCallback(
    async newText => {
      if (newText !== pinnedText) {
        await hmsActions.setSessionMetadata({
          pinnedText: newText,
        });
        sendEvent(newText);
      }
    },
    [hmsActions, pinnedText, sendEvent]
  );

  return { pinnedText, changePinnedText };
};
