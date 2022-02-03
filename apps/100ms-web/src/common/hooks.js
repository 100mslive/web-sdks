// @ts-check
import {
  useHMSActions,
  useHMSStore,
  selectPeerCount,
  selectPermissions,
} from "@100mslive/react-sdk";
import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../store/AppContext";

/**
 * Hook to execute a callback when alone in room(after a certain 5d of time)
 * @param {number} thresholdMs The threshold(in ms) after which the callback is executed,
 * starting from the instant when alone in room.
 * note: the cb is not called when another peer joins during this period.
 */
export const useWhenAloneInRoom = (thresholdMs = 5 * 60 * 1000) => {
  const peerCount = useHMSStore(selectPeerCount);
  const [aloneForLong, setAloneForLong] = useState(false);
  const cbTimeout = useRef(null);
  const alone = peerCount === 1;

  useEffect(() => {
    if (alone) {
      cbTimeout.current = setTimeout(() => {
        setAloneForLong(true);
      }, thresholdMs);
    } else {
      cbTimeout.current && clearTimeout(cbTimeout.current);
      cbTimeout.current = null;
      setAloneForLong(false);
    }

    return () => {
      cbTimeout.current && clearTimeout(cbTimeout.current);
      cbTimeout.current = null;
      setAloneForLong(false);
    };
  }, [alone, thresholdMs]);

  return { alone, aloneForLong };
};

export const useBeamAutoLeave = () => {
  const hmsActions = useHMSActions();
  const permissions = useHMSStore(selectPermissions);
  const {
    loginInfo: { isHeadless },
  } = useContext(AppContext);
  const { aloneForLong } = useWhenAloneInRoom();

  /**
   * End room after 5 minutes of being alone in the room to stop beam
   * Note: Leave doesn't stop beam
   */
  useEffect(() => {
    if (aloneForLong && isHeadless && permissions.endRoom) {
      hmsActions.endRoom(false, "Stop Beam");
    }
  }, [aloneForLong, isHeadless, hmsActions, permissions]);
};
