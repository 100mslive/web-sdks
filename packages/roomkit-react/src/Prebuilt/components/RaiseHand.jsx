import React from 'react';
import { selectHasPeerHandRaised, selectLocalPeerID, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { HandIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../Tooltip';
import IconButton from '../IconButton';

export const RaiseHand = () => {
  const localPeerId = useHMSStore(selectLocalPeerID);
  const isHandRaised = useHMSStore(selectHasPeerHandRaised(localPeerId));
  const actions = useHMSActions();

  return (
    <Tooltip title={isHandRaised ? 'Lower hand' : 'Raise hand'}>
      <IconButton
        active={!isHandRaised}
        onClick={() => {
          isHandRaised ? actions.lowerLocalPeerHand() : actions.raiseLocalPeerHand();
        }}
      >
        <HandIcon />
      </IconButton>
    </Tooltip>
  );
};
