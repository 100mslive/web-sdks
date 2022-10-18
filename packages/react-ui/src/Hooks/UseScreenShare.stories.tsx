import React from 'react';
import { ShareScreenIcon } from '@100mslive/react-icons';
import { useScreenShare } from '@100mslive/react-sdk';
import { Tooltip } from '../Tooltip';
import { IconButton } from '../IconButton';
import { ComponentStory } from '@storybook/react';
import { Text } from '../Text';
import { Flex } from '../Layout';
import { Video } from '../Video';
import mdx from './UseScreenShare.mdx';

const ScreenShare: ComponentStory<typeof Tooltip> = () => {
  const { amIScreenSharing, screenShareVideoTrackId: video, toggleScreenShare } = useScreenShare();
  const isVideoScreenshare = amIScreenSharing && !!video;

  return (
    <Flex direction="column">
      <Video trackId={video} css={{ bg: '$bgSecondary', mb: '$4', maxWidth: '600px' }} />
      <Flex align="center" gap="2">
        <Tooltip title={`${!isVideoScreenshare ? 'Start' : 'Stop'} screen sharing`}>
          <IconButton
            active={!isVideoScreenshare}
            onClick={() => {
              toggleScreenShare && toggleScreenShare();
            }}
            css={{ w: 'max-content', bg: '$bgSecondary' }}
          >
            <ShareScreenIcon />
          </IconButton>
        </Tooltip>
        <Text>Screensharing {!isVideoScreenshare ? 'Inactive' : 'Active'}</Text>
      </Flex>
    </Flex>
  );
};

const Story = {
  title: 'Hooks/useScreenShare',
  component: ScreenShare,
  parameters: {
    docs: {
      page: mdx,
    },
  },
};

export default Story;

export const UseScreenShare = ScreenShare.bind({});
UseScreenShare.storyName = 'useScreenShare';
