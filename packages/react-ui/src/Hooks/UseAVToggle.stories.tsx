import React from 'react';
import { ComponentStory } from '@storybook/react';
import { selectLocalVideoTrackID, useAVToggle, useHMSStore } from '@100mslive/react-sdk';
import UseAVToggleDocs from './UseAVToggle.mdx';
import { Button } from '../Button';
import { StoryHMSProviderWrapper } from '../common/HMSProviderWrapper';
import { Box, Flex } from '../Layout';
import Video, { StyledVideo } from '../Video/Video';

const VideoHook: ComponentStory<typeof StyledVideo> = () => {
  const localVideoTrackID = useHMSStore(selectLocalVideoTrackID);
  const { isLocalVideoEnabled, isLocalAudioEnabled, toggleVideo, toggleAudio } = useAVToggle();

  return (
    <Box>
      <Flex gap="1">
        <Button onClick={() => toggleVideo && toggleVideo()}>
          {isLocalVideoEnabled ? 'Disable video' : 'Enable video'}
        </Button>
        <Button variant="standard" onClick={() => toggleAudio && toggleAudio()}>
          {isLocalAudioEnabled ? 'Disable audio' : 'Enable audio'}
        </Button>
      </Flex>
      <Video css={{ bg: '$backgroundDark', mt: '$4', maxWidth: '800px' }} trackId={localVideoTrackID} />
    </Box>
  );
};

const Template = () => {
  return (
    <StoryHMSProviderWrapper>
      <VideoHook />
    </StoryHMSProviderWrapper>
  );
};

const VideoStories = {
  title: 'Hooks/useAVToggle',
  component: Template,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  parameters: {
    docs: {
      page: UseAVToggleDocs,
    },
  },
};

export default VideoStories;

export const UseVideoHook = Template.bind({});
UseVideoHook.storyName = 'useAVToggle';
