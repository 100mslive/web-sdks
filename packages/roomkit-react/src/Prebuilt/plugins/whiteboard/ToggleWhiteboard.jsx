import React from 'react';
import { PencilDrawIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../../Tooltip';
import IconButton from '../../IconButton';
import { useWhiteboardMetadata } from './useWhiteboardMetadata';

export const ToggleWhiteboard = ({ isHLSViewer }) => {
  const {
    whiteboardEnabled,
    whiteboardOwner: whiteboardActive,
    amIWhiteboardOwner,
    toggleWhiteboard,
  } = useWhiteboardMetadata();

  if (!whiteboardEnabled || isHLSViewer) {
    return null;
  }

  return (
    <Tooltip
      title={whiteboardActive ? (amIWhiteboardOwner ? `Stop whiteboard` : `Can't stop whiteboard`) : 'Start whiteboard'}
      key="whiteboard"
    >
      <IconButton
        onClick={toggleWhiteboard}
        active={!whiteboardActive}
        disabled={whiteboardActive && !amIWhiteboardOwner}
        data-testid="white_board_btn"
      >
        <PencilDrawIcon />
      </IconButton>
    </Tooltip>
  );
};
