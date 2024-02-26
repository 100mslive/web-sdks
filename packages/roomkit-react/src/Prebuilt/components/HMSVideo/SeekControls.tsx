import React from 'react';
import { BackwardArrowIcon, ForwardArrowIcon } from '@100mslive/react-icons';
import { IconButton, Tooltip } from '../../..';
import { useHMSPlayerContext } from './PlayerContext';

export enum SeekPath {
  Forward,
  Backward,
}

export const SeekControls = ({
  variants,
  width = 20,
  height = 20,
}: {
  variants: SeekPath;
  width: number;
  height: number;
}) => {
  const { hlsPlayer } = useHMSPlayerContext();
  if (variants === SeekPath.Backward) {
    return (
      <Tooltip title="backward" side="top">
        <IconButton
          onClick={e => {
            e.stopPropagation();
            hlsPlayer?.seekTo(hlsPlayer?.getVideoElement()?.currentTime - 10);
          }}
          data-testid="backward_arrow_btn"
        >
          <BackwardArrowIcon width={width} height={height} />
        </IconButton>
      </Tooltip>
    );
  }
  return (
    <Tooltip title="forward" side="top">
      <IconButton
        onClick={e => {
          e.stopPropagation();
          hlsPlayer?.seekTo(hlsPlayer?.getVideoElement()?.currentTime + 10);
        }}
        data-testid="forward_arrow_btn"
      >
        <ForwardArrowIcon width={width} height={height} />
      </IconButton>
    </Tooltip>
  );
};
