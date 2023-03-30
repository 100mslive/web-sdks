import { useEffect } from "react";
import {
  selectIsConnectedToRoom,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";

/**
 * Refresh(re-populate) session metadata on receiving refresh broadcast message of type metadata
 */
export const useRefreshSessionMetadata = () => {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);

  useEffect(() => {
    (async () => {
      if (isConnected) {
        await hmsActions.sessionStore.observe("default").then(() => {
          hmsActions.sessionStore.observe("spotlight");
        });
      }
    })();
  }, [hmsActions, isConnected]);
};
