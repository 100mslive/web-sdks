import { selectLocalVideoTrackID, useAVToggle, useHMSStore } from '@100mslive/react-sdk';
import Video, { StyledVideo } from '../Video/Video';
import React from 'react';
import { ComponentStory } from '@storybook/react';

const VideoHook: ComponentStory<typeof StyledVideo> = () => {
  const localVideoTrackID = useHMSStore(selectLocalVideoTrackID);
  const { isLocalVideoEnabled, isLocalAudioEnabled, toggleVideo, toggleAudio } = useAVToggle();

  return (
    <div>
      <button onClick={() => toggleVideo && toggleVideo()}>
        {isLocalVideoEnabled ? 'Disable video' : 'Enable video'}
      </button>
      <button onClick={() => toggleAudio && toggleAudio()}>
        {isLocalAudioEnabled ? 'Disable audio' : 'Enable audio'}
      </button>
      <Video css={{ bg: '$backgroundDark' }} trackId={localVideoTrackID} />
    </div>
  );
};

const VideoStories = {
  title: 'Hooks/useAVToggle',
  component: VideoHook,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
};

export default VideoStories;

export const UseVideoHook = VideoHook.bind({});
UseVideoHook.storyName = 'useAVToggle';
