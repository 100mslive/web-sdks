import { useEffect } from 'react';
import { selectLocalPeerRoleName, useHMSVanillaStore } from '@100mslive/react-sdk';
// @ts-ignore: No implicit Any
import { useMyMetadata } from './hooks/useMetadata';

export const PreviousRoleInMetadata = () => {
  const vanillaStore = useHMSVanillaStore();
  const { updateMetaData } = useMyMetadata();

  useEffect(() => {
    let previousRole = vanillaStore.getState(selectLocalPeerRoleName);
    const unsubscribe = vanillaStore.subscribe(currentRole => {
      if (previousRole !== currentRole && currentRole) {
        updateMetaData({ prevRole: previousRole });
        previousRole = currentRole;
      }
    }, selectLocalPeerRoleName);
    return unsubscribe;
  }, [vanillaStore]); //eslint-disable-line
  return null;
};
