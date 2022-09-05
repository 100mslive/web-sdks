import { useMemo, useCallback } from "react";
import {
  selectRoomMetadata,
  useCustomEvent,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { addOrRemoveFromArray } from "../../common/utils";

/** @TODO remove peerId from room metadata once peer leaves */

export const useBlacklistPeers = () => {
  const hmsActions = useHMSActions();
  const roomMetadata = useHMSStore(selectRoomMetadata);
  const blacklistedPeers = useMemo(
    () => roomMetadata?.blacklistedPeers || [],
    [roomMetadata]
  );

  const changeRoomMetadatalocally = (peerId, add) => {
    const newBlacklistedPeers = addOrRemoveFromArray(
      blacklistedPeers,
      peerId,
      add
    );
    if (newBlacklistedPeers) {
      hmsActions.changeRoomMetadata(
        { blacklistedPeers: newBlacklistedPeers },
        true
      );
    }
  };

  const { sendEvent: sendAddEvent } = useCustomEvent({
    type: "add-blacklist-peer",
    onEvent: peerId => changeRoomMetadatalocally(peerId, true),
  });
  const { sendEvent: sendRemoveEvent } = useCustomEvent({
    type: "remove-blacklist-peer",
    onEvent: peerId => changeRoomMetadatalocally(peerId, false),
  });

  const blacklistPeer = useCallback(
    async (peerId, add) => {
      const newBlacklistedPeers = addOrRemoveFromArray(
        blacklistedPeers,
        peerId,
        add
      );

      if (newBlacklistedPeers) {
        await hmsActions.changeRoomMetadata({
          blacklistedPeers: newBlacklistedPeers,
        });
        add ? await sendAddEvent(peerId) : await sendRemoveEvent(peerId);
      }
    },
    [hmsActions, blacklistedPeers, sendAddEvent, sendRemoveEvent]
  );

  return { blacklistedPeers, blacklistPeer };
};
