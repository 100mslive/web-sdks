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

  const update = async updatedFields => {
    try {
      // get current state from store and merge updated fields
      const currentMetadata = vanillaStore.getState(selectPeerMetadata(localPeerId));
      await hmsActions.changeMetadata(Object.assign(currentMetadata, updatedFields));
      return true;
    } catch (error) {
      console.error('failed to update metadata ', updatedFields);
    }
  };

  const toggleHandRaise = useCallback(async () => {
    if (isHandRaised) {
      await hmsActions.lowerLocalPeerHand();
    } else {
      await hmsActions.raiseLocalPeerHand();
      await update({ isBRBOn: false });
    }
  }, [isHandRaised]); //eslint-disable-line

  const toggleBRB = useCallback(async () => {
    const newValue = !metaData?.isBRBOn;
    await update({ isBRBOn: newValue });
    if (newValue) {
      await hmsActions.lowerLocalPeerHand();
    }
  }, [metaData?.isBRBOn]); //eslint-disable-line

  const setPrevRole = async role => {
    await update({
      prevRole: role,
    });
  };

  return {
    isHandRaised,
    isBRBOn: !!metaData?.isBRBOn,
    metaData,
    updateMetaData: update,
    toggleHandRaise,
    toggleBRB,
    setPrevRole,
  };
};
