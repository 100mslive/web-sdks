import {
  useHMSActions,
  useHMSStore,
  selectLocalPeer,
  selectPeerMetadata,
} from "@100mslive/hms-video-react";

export const useMetadata = () => {
  const hmsActions = useHMSActions();
  const peer = useHMSStore(selectLocalPeer);
  const isHandRaised =
    useHMSStore(selectPeerMetadata(peer.id))?.isHandRaised || false;
  /**
   * @param isHandRaised {boolean}
   */
  const setIsHandRaised = async isHandRaised => {
    try {
      await hmsActions.changeMetadata({ isHandRaised: isHandRaised });
    } catch (error) {
      console.error("failed to set isHandRaised", error);
    }
  };
  const isBRB = useHMSStore(selectPeerMetadata(peer.id))?.isBRB || false;
  /**
   * @param isBRB {boolean}
   */
  const setIsBRB = async isBRB => {
    try {
      await hmsActions.changeMetadata({ isBRB: isBRB });
    } catch (error) {
      console.error("failed to set BBR", error);
    }
  };
  return { isHandRaised, isBRB, setIsHandRaised, setIsBRB };
};
