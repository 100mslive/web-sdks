import { useRemoteAVToggle } from '@100mslive/react-sdk';
import Video, { StyledVideo } from '../Video/Video';
import React from 'react';
import { ComponentStory } from '@storybook/react';

const VideoHook: ComponentStory<typeof StyledVideo> = () => {
  const videoTrackId = '100';
  const { isVideoEnabled, isAudioEnabled, toggleVideo, toggleAudio } = useRemoteAVToggle('1', videoTrackId);

  return (
    <div>
      <button onClick={() => toggleVideo && toggleVideo()}>{isVideoEnabled ? 'Disable video' : 'Enable video'}</button>
      <button onClick={() => toggleAudio && toggleAudio()}>{isAudioEnabled ? 'Disable audio' : 'Enable audio'}</button>
      <Video css={{ bg: '$backgroundDark' }} trackId={videoTrackId} />
    </div>
  );
};

const VideoStories = {
  title: 'Hooks/useRemoteAVToggle',
  component: VideoHook,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
};

export default VideoStories;

export const UseVideoHook = VideoHook.bind({});
UseVideoHook.storyName = 'useRemoteAVToggle';
