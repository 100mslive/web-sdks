import { useMemo, useCallback } from "react";
import {
  selectSessionMetadata,
  useCustomEvent,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { addOrRemoveFromArray } from "../../common/utils";

/** @TODO remove peerId from room metadata once peer leaves */

export const useBlacklistPeers = () => {
  const hmsActions = useHMSActions();
  const sessionMetadata = useHMSStore(selectSessionMetadata);
  const blacklistedPeers = useMemo(
    () => sessionMetadata?.blacklistedPeers || [],
    [sessionMetadata]
  );

  const changeSessionMetadatalocally = (peerId, add) => {
    const newBlacklistedPeers = addOrRemoveFromArray(
      blacklistedPeers,
      peerId,
      add
    );
    if (newBlacklistedPeers) {
      hmsActions.changeSessionMetadata(
        { blacklistedPeers: newBlacklistedPeers },
        true
      );
    }
  };

  const { sendEvent: sendAddEvent } = useCustomEvent({
    type: "add-blacklist-peer",
    onEvent: peerId => changeSessionMetadatalocally(peerId, true),
  });
  const { sendEvent: sendRemoveEvent } = useCustomEvent({
    type: "remove-blacklist-peer",
    onEvent: peerId => changeSessionMetadatalocally(peerId, false),
  });

  const blacklistPeer = useCallback(
    async (peerId, add) => {
      const newBlacklistedPeers = addOrRemoveFromArray(
        blacklistedPeers,
        peerId,
        add
      );

      if (newBlacklistedPeers) {
        await hmsActions.changeSessionMetadata({
          blacklistedPeers: newBlacklistedPeers,
        });
        add ? await sendAddEvent(peerId) : await sendRemoveEvent(peerId);
      }
    },
    [hmsActions, blacklistedPeers, sendAddEvent, sendRemoveEvent]
  );

  return { blacklistedPeers, blacklistPeer };
};
