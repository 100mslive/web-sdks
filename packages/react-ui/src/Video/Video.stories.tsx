import React from 'react';
import { Video } from './Video';
import VideoDocs from './Video.mdx';
import { StoryHMSProviderWrapper } from '../common/HMSProviderWrapper';

const VideoComponent = () => {
  return (
    <StoryHMSProviderWrapper>
      <Video trackId="2" />
    </StoryHMSProviderWrapper>
  )
};

const StyledVideoComponent = () => {
  return (
    <StoryHMSProviderWrapper>
      <Video css={{ width: 500, height: 300 }} trackId="2" />;
    </StoryHMSProviderWrapper>
  );
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
