import React from 'react';
import { useScreenShare } from '@100mslive/react-sdk';
import { ShareScreenIcon } from '@100mslive/react-icons';
import mdx from './UseScreenShare.mdx';
import { IconButton } from '../IconButton';
import { Flex } from '../Layout';
import { Text } from '../Text';
import { Tooltip } from '../Tooltip';
import { Video } from '../Video';
import { StoryHMSProviderWrapper } from '../common/HMSProviderWrapper';

const ScreenShare = () => {
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

const Template = () => {
 return (
  <StoryHMSProviderWrapper>
    <ScreenShare />
  </StoryHMSProviderWrapper>
 );
}

const Story = {
  title: 'Hooks/useScreenShare',
  component: Template,
  parameters: {
    docs: {
      page: mdx,
    },
  },
};

export default Story;

export const UseScreenShare = Template.bind({});
UseScreenShare.storyName = 'useScreenShare';
