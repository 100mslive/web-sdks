import React from 'react';
import { Flex, IconButton, Tooltip } from '../../..';

export const FullScreenButton = ({
  isFullScreen,
  icon,
  onToggle,
}: {
  isFullScreen: boolean;
  icon: any;
  onToggle: () => void;
}) => {
  return (
    <Tooltip title={`${isFullScreen ? 'Exit' : 'Go'} fullscreen`} side="top">
      <IconButton css={{ margin: '0px' }} onClick={onToggle} key="fullscreen_btn" data-testid="fullscreen_btn">
        <Flex>{icon}</Flex>
      </IconButton>
    </Tooltip>
  );
};
