import React from 'react';
import { HandIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../Tooltip';
import IconButton from '../IconButton';
import { useMyMetadata } from './hooks/useMetadata';

export const RaiseHand = () => {
  const { isHandRaised, toggleHandRaise } = useMyMetadata();
  return (
    <Tooltip title={isHandRaised ? 'Lower hand' : 'Raise hand'}>
      <IconButton active={!isHandRaised} onClick={async () => await toggleHandRaise()}>
        <HandIcon />
      </IconButton>
    </Tooltip>
  );
};
