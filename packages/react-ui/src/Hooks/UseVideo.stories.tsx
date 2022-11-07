import React from 'react';
import { useVideo } from '@100mslive/react-sdk';
import UseVideoDocs from './UseVideo.mdx';
import { StoryHMSProviderWrapper } from '../common/HMSProviderWrapper';
import { StyledVideo } from '../Video';

const VideoHook = () => {
  const { videoRef } = useVideo({
    trackId: '1',
  });
  return <StyledVideo css={{ maxWidth: '800px' }} ref={videoRef} autoPlay playsInline muted />;
};

const Template = () => {
  return (
    <StoryHMSProviderWrapper>
      <VideoHook />
    </StoryHMSProviderWrapper>
  );
};

const VideoStories = {
  title: 'Hooks/useVideo',
  component: Template,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  parameters: {
    docs: {
      page: UseVideoDocs,
    },
  },
};

export default VideoStories;

export const UseVideoHook = Template.bind({});
UseVideoHook.storyName = 'useVideo';
