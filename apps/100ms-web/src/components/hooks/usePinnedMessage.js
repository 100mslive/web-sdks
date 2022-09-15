import { useCallback } from "react";
import {
  selectSessionMetadata,
  useCustomEvent,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";

const REFRESH_MESSAGE = "refresh";

export const usePinnedMessage = () => {
  const hmsActions = useHMSActions();
  const pinnedMessage = useHMSStore(selectSessionMetadata)?.pinnedMessage;

  const { sendEvent } = useCustomEvent({
    type: "metadata",
    onEvent: message => {
      if (message === REFRESH_MESSAGE) {
        hmsActions.populateSessionMetadata();
      }
    },
  });

  const setPinnedMessage = useCallback(
    async newText => {
      if (newText !== pinnedMessage) {
        await hmsActions.setSessionMetadata({
          pinnedMessage: newText,
        });
        sendEvent(REFRESH_MESSAGE);
      }
    },
    [hmsActions, pinnedMessage, sendEvent]
  );

  return { pinnedMessage, setPinnedMessage };
};
