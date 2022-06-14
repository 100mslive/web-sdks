import { useVideo } from '@100mslive/react-sdk';
import { StyledVideo } from './Video';
import UseVideoDocs from './Use-Video.mdx';
import React from 'react';

const VideoHook = () => {
  const { videoRef } = useVideo({
    trackId: '1',
  });
  return <StyledVideo ref={videoRef} autoPlay playsInline muted />;
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
