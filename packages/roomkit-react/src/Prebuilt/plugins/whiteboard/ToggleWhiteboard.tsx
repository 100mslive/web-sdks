import React from 'react';
import { ConferencingScreen } from '@100mslive/types-prebuilt';
import { PencilDrawIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../../Tooltip';
// @ts-ignore: No implicit any
import IconButton from '../../IconButton';
// @ts-ignore: No implicit any
import { useWhiteboardMetadata } from './useWhiteboardMetadata';

export const ToggleWhiteboard = ({ screenType }: { screenType: keyof ConferencingScreen }) => {
  const {
    whiteboardEnabled,
    whiteboardOwner: whiteboardActive,
    amIWhiteboardOwner,
    toggleWhiteboard,
  } = useWhiteboardMetadata();

  if (!whiteboardEnabled || screenType === 'hls_live_streaming') {
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
