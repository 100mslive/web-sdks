import { useMemo, useCallback } from "react";
import {
  selectRoomMetadata,
  useCustomEvent,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { addOrRemoveFromArray } from "../../common/utils";

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

  const addBlacklistPeer = useCallback(
    async peerId => {
      const newBlacklistedPeers = addOrRemoveFromArray(
        blacklistedPeers,
        peerId,
        true
      );

      if (newBlacklistedPeers) {
        await hmsActions.changeRoomMetadata({
          blacklistedPeers: newBlacklistedPeers,
        });
        await sendAddEvent(peerId);
      }
    },
    [hmsActions, sendAddEvent, blacklistedPeers]
  );

  const removeBlacklistPeer = useCallback(
    async peerId => {
      const newBlacklistedPeers = addOrRemoveFromArray(
        blacklistedPeers,
        peerId,
        false
      );

      if (newBlacklistedPeers) {
        await hmsActions.changeRoomMetadata({
          blacklistedPeers: newBlacklistedPeers,
        });
        await sendRemoveEvent(peerId);
      }
    },
    [hmsActions, sendRemoveEvent, blacklistedPeers]
  );

  const blacklistPeer = useCallback(
    async (peerId, add) => {
      add ? await addBlacklistPeer(peerId) : await removeBlacklistPeer(peerId);
    },
    [addBlacklistPeer, removeBlacklistPeer]
  );
  return { blacklistedPeers, blacklistPeer };
};
