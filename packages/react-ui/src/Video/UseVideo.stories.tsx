import React from 'react';
import { useVideo } from '@100mslive/react-sdk';
import UseVideoDocs from './UseVideo.mdx';
import { StyledVideo } from './Video';

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
