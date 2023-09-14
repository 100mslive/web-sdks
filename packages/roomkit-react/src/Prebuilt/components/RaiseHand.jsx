import React from 'react';
import { selectLocalPeer, selectPeerMetadata, useHMSStore } from '@100mslive/react-sdk';
import { HandIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../Tooltip';
import IconButton from '../IconButton';
import { useMyMetadata } from './hooks/useMetadata';

export const RaiseHand = () => {
  const { toggleHandRaise } = useMyMetadata();
  const localPeer = useHMSStore(selectLocalPeer);
  const isHandRaised = useHMSStore(selectPeerMetadata(localPeer.id))?.isHandRaised || false;

  return (
    <Tooltip title={isHandRaised ? 'Lower hand' : 'Raise hand'}>
      <IconButton active={!isHandRaised} onClick={toggleHandRaise}>
        <HandIcon />
      </IconButton>
    </Tooltip>
  );
};
