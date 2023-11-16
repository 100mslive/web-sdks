import React from 'react';
import { PauseIcon, PlayIcon } from '@100mslive/react-icons';
import { IconButton, Tooltip } from '../../../';

export const PlayButton = ({ onClick, isPaused }) => {
  return (
    <Tooltip title={isPaused ? 'Play' : 'Pause'} side="top">
      <IconButton onClick={onClick} data-testid="play_pause_btn">
        {isPaused ? <PlayIcon width={20} height={20} /> : <PauseIcon width={20} height={20} />}
      </IconButton>
    </Tooltip>
  );
};
