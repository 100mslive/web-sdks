import React from 'react';
import { ClosedCaptionIcon, OpenCaptionIcon } from '@100mslive/react-icons';
import { IconButton, Tooltip } from '../../../';
import { useHMSPlayerContext } from './PlayerContext';

export function HLSCaptionSelector({ isEnabled }: { isEnabled: boolean }) {
  const { hlsPlayer } = useHMSPlayerContext();
  return (
    <Tooltip title="Subtitles/closed captions" side="top">
      <IconButton css={{ p: '2' }} onClick={() => hlsPlayer?.toggleCaption()}>
        {isEnabled ? <ClosedCaptionIcon width="20" height="20px" /> : <OpenCaptionIcon width="20" height="20px" />}
      </IconButton>
    </Tooltip>
  );
}
