import React from 'react';
import { useVideo } from '@100mslive/react-sdk';
import UseVideoDocs from './UseVideo.mdx';
import { StyledVideo } from './Video';
import { StoryHMSProviderWrapper } from '../common/HMSProviderWrapper';

const VideoHookWrapper = () => {
  const { videoRef } = useVideo({
    trackId: '1',
  });
  return <StyledVideo ref={videoRef} autoPlay playsInline muted />;
}
const VideoHook = () => {
  return (
    <StoryHMSProviderWrapper>
      <VideoHookWrapper />
    </StoryHMSProviderWrapper>
  )
};

const VideoStories = {
  title: 'Rendering Video/useVideo hook',
  component: VideoHook,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  parameters: {
    docs: {
      page: UseVideoDocs,
    },
  },
};

export default VideoStories;

export const UseVideoHook = VideoHook.bind({});
