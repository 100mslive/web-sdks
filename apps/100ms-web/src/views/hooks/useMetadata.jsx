import {
  useHMSActions,
  useHMSStore,
  selectLocalPeer,
  selectPeerMetadata,
} from "@100mslive/hms-video-react";

export const useMetadata = () => {
  const hmsActions = useHMSActions();
  const peer = useHMSStore(selectLocalPeer);
  const metadata = useHMSStore(selectPeerMetadata(peer.id));
  /**
   * @param isHandRaised {boolean}
   */
  const setIsHandRaised = async isHandRaised => {
    try {
      await hmsActions.changeMetadata({ ...metadata, isHandRaised });
    } catch (error) {
      console.error("failed to set isHandRaised", error);
    }
  };
  return { ...metadata, setIsHandRaised: setIsHandRaised };
};
