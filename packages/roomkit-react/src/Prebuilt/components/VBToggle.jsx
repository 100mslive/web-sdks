import React from 'react';
import { VirtualBackgroundIcon } from '@100mslive/react-icons';
import IconButton from '../IconButton';
import { useSidepaneToggle } from './AppData/useSidepane';
import { SIDE_PANE_OPTIONS } from '../common/constants';

export const VBToggle = () => {
  const toggleVB = useSidepaneToggle(SIDE_PANE_OPTIONS.VB);
  return (
    <IconButton onClick={toggleVB}>
      <VirtualBackgroundIcon />
    </IconButton>
  );
};
