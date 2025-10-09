import { selectIsTranscriptionEnabled, useHMSStore } from '@100mslive/react-sdk';
import { ClosedCaptionIcon, OpenCaptionIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../Tooltip';
// @ts-ignore: No implicit Any
import IconButton from '../IconButton';
// @ts-ignore: No implicit Any
import { useSetIsCaptionEnabled } from './AppData/useUISettings.js';

export const CaptionIcon = () => {
  const isCaptionPresent = useHMSStore(selectIsTranscriptionEnabled);
  const [isCaption, setIsCaption] = useSetIsCaptionEnabled();

  const onClick = () => {
    setIsCaption(!isCaption);
  };
  if (!isCaptionPresent) {
    return null;
  }
  return (
    <Tooltip title={isCaption ? 'Hide closed captions' : 'Show closed captions'}>
      <IconButton data-testid="caption_btn" onClick={onClick}>
        {isCaption ? <ClosedCaptionIcon width="20" height="20px" /> : <OpenCaptionIcon width="20" height="20px" />}
      </IconButton>
    </Tooltip>
  );
};
