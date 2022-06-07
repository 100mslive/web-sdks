import { useVideo } from '@100mslive/react-sdk';
import { Video, StyledVideo } from './Video';
import VideoDocs from './Video.mdx';
import React from 'react';

const VideoComponent = () => {
  return <Video trackId="2" />;
};

const VideoHook = () => {
  const { videoRef } = useVideo({
    trackId: '1',
  });
  return <StyledVideo ref={videoRef} autoPlay playsInline muted />;
};

export default {
  title: 'Example/Video',
  component: VideoComponent,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  parameters: {
    docs: {
      page: VideoDocs,
    },
  },
};

export const VideoExample = VideoComponent.bind({});
export const UseVideoHook = VideoHook.bind({});
