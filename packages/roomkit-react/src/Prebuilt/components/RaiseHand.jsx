import React from 'react';
import { selectLocalPeer, selectPeerMetadata, useHMSStore } from '@100mslive/react-sdk';
import { HandIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../Tooltip';
import IconButton from '../IconButton';
import { useIsFeatureEnabled } from './hooks/useFeatures';
import { useMyMetadata } from './hooks/useMetadata';
import { FEATURE_LIST } from '../common/constants';

export const RaiseHand = () => {
  const isHandRaiseEnabled = useIsFeatureEnabled(FEATURE_LIST.HAND_RAISE);
  const { toggleHandRaise } = useMyMetadata();
  const localPeer = useHMSStore(selectLocalPeer);
  const isHandRaised = useHMSStore(selectPeerMetadata(localPeer.id))?.isHandRaised || false;

  if (!isHandRaiseEnabled) {
    return null;
  }

  return (
    <Tooltip title={isHandRaised ? 'Lower hand' : 'Raise hand'}>
      <IconButton active={!isHandRaised} onClick={toggleHandRaise}>
        <HandIcon />
      </IconButton>
    </Tooltip>
  );
};
