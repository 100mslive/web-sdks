import { MouseEvent } from 'react';
import { PauseIcon, PlayIcon } from '@100mslive/react-icons';
import { IconButton, Tooltip } from '../../..';
import { useHMSPlayerContext } from './PlayerContext';

export const PlayPauseButton = ({
  isPaused,
  width = 20,
  height = 20,
}: {
  isPaused: boolean;
  width?: number;
  height?: number;
}) => {
  const { hlsPlayer } = useHMSPlayerContext();
  const onClick = async (event: MouseEvent) => {
    event?.stopPropagation();
    isPaused ? await hlsPlayer?.play() : hlsPlayer?.pause();
  };
  return (
    <Tooltip title={isPaused ? 'Play' : 'Pause'} side="top">
      <IconButton onClick={onClick} data-testid="play_pause_btn">
        {isPaused ? <PlayIcon width={width} height={height} /> : <PauseIcon width={width} height={height} />}
      </IconButton>
    </Tooltip>
  );
};
