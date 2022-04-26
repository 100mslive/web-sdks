import { useCallback } from "react";
import {
  selectAppData,
  useHMSActions,
  useHMSStore,
  useHMSVanillaStore,
} from "@100mslive/react-sdk";
import { APP_DATA } from "../../common/constants";

export const useChatOpen = () => {
  const isChatOpen = useHMSStore(selectAppData(APP_DATA.chatOpen));
  return isChatOpen;
};

export const useToggleChat = () => {
  const hmsActions = useHMSActions();
  const vanillaStore = useHMSVanillaStore();
  const toggleChat = useCallback(() => {
    const isChatOpen = vanillaStore.getState(selectAppData(APP_DATA.chatOpen));
    hmsActions.setAppData(APP_DATA.chatOpen, !isChatOpen, true);
  }, [vanillaStore, hmsActions]);
  return toggleChat;
};
