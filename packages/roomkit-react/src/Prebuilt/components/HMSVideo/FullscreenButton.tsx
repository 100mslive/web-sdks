import { ExpandIcon, ShrinkIcon } from '@100mslive/react-icons';
import { Flex, IconButton, Tooltip } from '../../..';

export const FullScreenButton = ({ isFullScreen, onToggle }: { isFullScreen: boolean; onToggle: () => void }) => {
  return (
    <Tooltip title={`${isFullScreen ? 'Exit' : 'Go'} fullscreen`} side="top">
      <IconButton css={{ margin: '0px' }} onClick={onToggle} key="fullscreen_btn" data-testid="fullscreen_btn">
        <Flex>{isFullScreen ? <ShrinkIcon /> : <ExpandIcon />}</Flex>
      </IconButton>
    </Tooltip>
  );
};
