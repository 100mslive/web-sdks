import React from 'react';
import { ComponentStory } from '@storybook/react';
import { useRemoteAVToggle } from '@100mslive/react-sdk';
import UseRemoteAVToggleDocs from './UseRemoteAVToggle.mdx';
import { Button } from '../Button';
import { StoryHMSProviderWrapper } from '../common/HMSProviderWrapper';
import { Box, Flex } from '../Layout';
import Video, { StyledVideo } from '../Video/Video';

const VideoHook: ComponentStory<typeof StyledVideo> = () => {
  const videoTrackId = '1';
  const { isVideoEnabled, isAudioEnabled, toggleVideo, toggleAudio } = useRemoteAVToggle('1', videoTrackId);

  return (
    <Box>
      <Flex gap="1">
        <Button onClick={() => toggleVideo && toggleVideo()}>
          {isVideoEnabled ? 'Disable video' : 'Enable video'}
        </Button>
        <Button variant="standard" onClick={() => toggleAudio && toggleAudio()}>
          {isAudioEnabled ? 'Disable audio' : 'Enable audio'}
        </Button>
      </Flex>
      <Video css={{ bg: '$backgroundDark', mt: '$4', maxWidth: '800px' }} trackId={videoTrackId} />
    </Box>
  );
};

const Template = () => {
 return (
  <StoryHMSProviderWrapper>
    <VideoHook />
  </StoryHMSProviderWrapper>
 );
}

const VideoStories = {
  title: 'Hooks/useRemoteAVToggle',
  component: Template,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  parameters: {
    docs: {
      page: UseRemoteAVToggleDocs,
    },
  },
};

export default VideoStories;

export const UseVideoHook = Template.bind({});
UseVideoHook.storyName = 'useRemoteAVToggle';
