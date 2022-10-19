import { selectLocalVideoTrackID, useAVToggle, useHMSStore } from '@100mslive/react-sdk';
import Video, { StyledVideo } from '../Video/Video';
import React from 'react';
import UseAVToggleDocs from './UseAVToggle.mdx';
import { ComponentStory } from '@storybook/react';
import { Box, Flex } from '../Layout';

const VideoHook: ComponentStory<typeof StyledVideo> = () => {
  const localVideoTrackID = useHMSStore(selectLocalVideoTrackID);
  const { isLocalVideoEnabled, isLocalAudioEnabled, toggleVideo, toggleAudio } = useAVToggle();

  return (
    <Box>
      <Flex gap="1">
        <button onClick={() => toggleVideo && toggleVideo()}>
          {isLocalVideoEnabled ? 'Disable video' : 'Enable video'}
        </button>
        <button onClick={() => toggleAudio && toggleAudio()}>
          {isLocalAudioEnabled ? 'Disable audio' : 'Enable audio'}
        </button>
      </Flex>
      <Video css={{ bg: '$backgroundDark', mt: '$4' }} trackId={localVideoTrackID} />
    </Box>
  );
};

const VideoStories = {
  title: 'Hooks/useAVToggle',
  component: VideoHook,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  parameters: {
    docs: {
      page: UseAVToggleDocs,
    },
  },
};

export default VideoStories;

export const UseVideoHook = VideoHook.bind({});
UseVideoHook.storyName = 'useAVToggle';
