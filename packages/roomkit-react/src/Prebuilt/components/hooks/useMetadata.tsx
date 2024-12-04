import { useCallback } from 'react';
import {
  selectHasPeerHandRaised,
  selectLocalPeerID,
  selectPeerMetadata,
  useHMSActions,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';

export const useMyMetadata = () => {
  const hmsActions = useHMSActions();
  const localPeerId = useHMSStore(selectLocalPeerID);
  const vanillaStore = useHMSVanillaStore();
  const metaData = useHMSStore(selectPeerMetadata(localPeerId));
  const isHandRaised = useHMSStore(selectHasPeerHandRaised(localPeerId));

  const update = async (updatedFields: Record<string, any>) => {
    try {
      // get current state from store and merge updated fields
      const currentMetadata = vanillaStore.getState(selectPeerMetadata(localPeerId));
      await hmsActions.changeMetadata(Object.assign(currentMetadata, updatedFields));
      return true;
    } catch (error) {
      console.error('failed to update metadata ', updatedFields);
    }
    return false;
  };

  const toggleHandRaise = useCallback(async () => {
    if (isHandRaised) {
      await hmsActions.lowerLocalPeerHand();
      await update({ handRaisedAt: undefined });
    } else {
      await hmsActions.raiseLocalPeerHand();
      await update({ isBRBOn: false, handRaisedAt: Date.now() });
    }
  }, [isHandRaised]); //eslint-disable-line

  const toggleBRB = useCallback(async () => {
    const newValue = !metaData?.isBRBOn;
    await update({ isBRBOn: newValue });
    if (newValue) {
      await hmsActions.lowerLocalPeerHand();
    }
  }, [metaData?.isBRBOn]); //eslint-disable-line

  return {
    isHandRaised,
    isBRBOn: !!metaData?.isBRBOn,
    metaData,
    updateMetaData: update,
    toggleHandRaise,
    toggleBRB,
  };
};
