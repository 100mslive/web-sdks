import React from 'react';
import { Video } from './Video';
import VideoDocs from './Video.mdx';

const VideoComponent = () => {
  return <Video trackId="2" />;
};

const StyledVideoComponent = () => {
  return <Video css={{ width: 500, height: 300 }} trackId="2" />;
};

const VideoStories = {
  title: 'Rendering Video/Video Component',
  component: VideoComponent,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  parameters: {
    docs: {
      page: VideoDocs,
    },
  },
};

export default VideoStories;

export const VideoExample = VideoComponent.bind({});
export const StyledVideoExample = StyledVideoComponent.bind({});
