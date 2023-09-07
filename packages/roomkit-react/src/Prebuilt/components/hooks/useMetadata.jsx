import { useCallback, useState } from 'react';
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
  const [isHandRaised, setHandRaised] = useState(metaData?.isHandRaised || false);
  const [isBRBOn, setBRBOn] = useState(metaData?.isBRBOn || false); // BRB = be right back

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
    const brbUpdate = !isHandRaised ? false : isBRBOn;
    const success = await update({
      isHandRaised: !isHandRaised,
      isBRBOn: brbUpdate,
    });
    if (success) {
      setBRBOn(brbUpdate);
      setHandRaised(!isHandRaised);
    }
  }, [isHandRaised, isBRBOn]); //eslint-disable-line

  const toggleBRB = useCallback(async () => {
    const handRaiseUpdate = !isBRBOn ? false : isHandRaised;
    const success = await update({
      isHandRaised: handRaiseUpdate,
      isBRBOn: !isBRBOn,
    });
    if (success) {
      setBRBOn(!isBRBOn);
      setHandRaised(handRaiseUpdate);
    }
  }, [isHandRaised, isBRBOn]); //eslint-disable-line

  const setPrevRole = async role => {
    await update({
      prevRole: role,
    });
  };

  return {
    isHandRaised,
    isBRBOn,
    metaData,
    updateMetaData: update,
    toggleHandRaise,
    toggleBRB,
    setPrevRole,
  };
};
