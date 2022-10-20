import React from 'react';
import { Box } from '../Layout';

import mdx from './UseAudioLevelStyles.mdx';

const AudioLevelStyles = () => {
  return (
    <Box>
    </Box>
  );
};

const AudioLevelStylesStory = {
  title: 'Hooks/useAudioLevelStyles',
  component: AudioLevelStyles,
  parameters: {
    docs: {
      page: mdx,
    },
  },
};

export default AudioLevelStylesStory;

export const UseAudioLevelStyles = AudioLevelStyles.bind({});
UseAudioLevelStyles.storyName = 'useAudioLevelStyles';
