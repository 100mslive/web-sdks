import { useRemoteAVToggle } from '@100mslive/react-sdk';
import Video, { StyledVideo } from '../Video/Video';
import UseRemoteAVToggleDocs from './UseRemoteAVToggle.mdx';
import React from 'react';
import { ComponentStory } from '@storybook/react';
import { Box, Flex } from '../Layout';
import { Button } from '../Button';

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

const VideoStories = {
  title: 'Hooks/useRemoteAVToggle',
  component: VideoHook,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  parameters: {
    docs: {
      page: UseRemoteAVToggleDocs,
    },
  },
};

export default VideoStories;

export const UseVideoHook = VideoHook.bind({});
UseVideoHook.storyName = 'useRemoteAVToggle';
