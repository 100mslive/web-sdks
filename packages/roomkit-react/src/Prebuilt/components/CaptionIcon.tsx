import React, { useEffect } from 'react';
import { ClosedCaptionIcon, OpenCaptionIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../Tooltip';
// @ts-ignore: No implicit Any
import IconButton from '../IconButton';
// @ts-ignore: No implicit Any
import { useSetIsCaptionEnabled } from './AppData/useUISettings';

export const CaptionIcon = () => {
  const [isCaption, setIsCaption] = useSetIsCaptionEnabled();

  useEffect(() => {
    setIsCaption(true);
  }, [setIsCaption]);
  const onClick = () => {
    setIsCaption(!isCaption);
  };
  return (
    <Tooltip title={isCaption ? 'Disable caption' : 'Enable caption'}>
      <IconButton data-testid="caption_btn" onClick={onClick}>
        {isCaption ? <ClosedCaptionIcon width="20" height="20px" /> : <OpenCaptionIcon width="20" height="20px" />}
      </IconButton>
    </Tooltip>
  );
};
