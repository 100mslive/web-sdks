import { useVideo } from '@100mslive/react-sdk';
import { styled, Video, StyledVideo } from '@100mslive/react-ui';

const VideoComponent = () => {
  return <Video trackId='2' />;
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
  argTypes: {},
};

export const VideoExample = VideoComponent.bind({});
export const UseVideoHook = VideoHook.bind({});
