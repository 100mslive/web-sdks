import { useCallback } from 'react';
import {
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
    await update({ isHandRaised: !metaData?.isHandRaised, isBRBOn: false });
  }, [metaData?.isHandRaised]); //eslint-disable-line

  const toggleBRB = useCallback(async () => {
    await update({ isBRBOn: !metaData?.isBRBOn, isHandRaised: false });
  }, [metaData?.isBRBOn]); //eslint-disable-line

  const setPrevRole = async role => {
    await update({
      prevRole: role,
    });
  };

  return {
    isHandRaised: !!metaData?.isHandRaised,
    isBRBOn: !!metaData?.isBRBOn,
    metaData,
    updateMetaData: update,
    toggleHandRaise,
    toggleBRB,
    setPrevRole,
  };
};
