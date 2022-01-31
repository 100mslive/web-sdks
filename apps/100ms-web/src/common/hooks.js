import { useHMSActions } from "@100mslive/hms-video-react";
import { useHMSStore, selectPeerCount } from "@100mslive/react-sdk";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../store/AppContext";

/**
 * @param {Function} cb
 */
const useWhenAloneInRoom = (cb, threshold = 5 * 60 * 1000) => {
  const peerCount = useHMSStore(selectPeerCount);
  const [cbTimeout, setCbTimeout] = useState(null);
  const alone = peerCount === 1;

  useEffect(() => {
    if (alone) {
      setCbTimeout(setTimeout(cb, threshold));
    } else {
      cbTimeout && clearTimeout(cbTimeout);
      setCbTimeout(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alone]);
};

export const useBeamAutoLeave = () => {
  const hmsActions = useHMSActions();
  const {
    loginInfo: { isHeadless },
  } = useContext(AppContext);
  useWhenAloneInRoom(() => {
    if (isHeadless) {
      hmsActions.leave();
    }
  });
};
