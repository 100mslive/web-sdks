import { useCallback } from "react";
import {
  selectSessionMetadata,
  useCustomEvent,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";

const REFRESH_MESSAGE = "refresh";

export const usePinnedText = () => {
  const hmsActions = useHMSActions();
  const pinnedText = useHMSStore(selectSessionMetadata)?.pinnedText;

  const { sendEvent } = useCustomEvent({
    type: "metadata",
    onEvent: message => {
      if (message === REFRESH_MESSAGE) {
        hmsActions.populateSessionMetadata();
      }
    },
  });

  const changePinnedText = useCallback(
    async newText => {
      if (newText !== pinnedText) {
        await hmsActions.setSessionMetadata({
          pinnedText: newText,
        });
        sendEvent(REFRESH_MESSAGE);
      }
    },
    [hmsActions, pinnedText, sendEvent]
  );

  return { pinnedText, changePinnedText };
};
