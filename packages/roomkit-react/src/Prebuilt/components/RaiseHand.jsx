import React from 'react';
import { HandIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../Tooltip';
import IconButton from '../IconButton';
// @ts-ignore: No implicit Any
import { useMyMetadata } from './hooks/useMetadata';

export const RaiseHand = () => {
  const { isHandRaised, toggleHandRaise } = useMyMetadata();
  return (
    <Tooltip title={isHandRaised ? 'Lower hand' : 'Raise hand'}>
      <IconButton data-testid="hand_raise_btn" active={!isHandRaised} onClick={async () => await toggleHandRaise()}>
        <HandIcon />
      </IconButton>
    </Tooltip>
  );
};
