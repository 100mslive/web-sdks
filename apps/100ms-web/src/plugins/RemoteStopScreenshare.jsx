import { useCustomEvent, useHMSActions } from "@100mslive/react-sdk";
import { useCallback } from "react";

export const remoteStopScreenshareType = "REMOTE_STOP_SCREENSHARE";

export function RemoteStopScreenshare() {
  const actions = useHMSActions();

  const onRemoteStopScreenshare = useCallback(async () => {
    await actions.setScreenShareEnabled(false);
  }, [actions]);

  useCustomEvent({
    type: remoteStopScreenshareType,
    onEvent: onRemoteStopScreenshare,
  });

  return <></>;
}
