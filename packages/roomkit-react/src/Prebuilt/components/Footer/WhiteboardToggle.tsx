import React from 'react';
import { selectWhiteboard, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { PencilDrawIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../..';
// @ts-ignore: No implicit Any
import IconButton from '../../IconButton';

export const WhiteboardToggle = () => {
  const open = useHMSStore(selectWhiteboard)?.open;
  const actions = useHMSActions().interactivityCenter.whiteboard;

  const toggle = () => {
    if (open) {
      actions.close();
    } else {
      actions.open();
    }
  };

  return (
    <Tooltip key="whiteboard" title={`${open ? 'Close' : 'Open'} Whiteboard`}>
      <IconButton onClick={toggle} active={!open} data-testid="whiteboard_btn">
        <PencilDrawIcon />
      </IconButton>
    </Tooltip>
  );
};
