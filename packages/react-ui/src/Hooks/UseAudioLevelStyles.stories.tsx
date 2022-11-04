import React from 'react';
import { selectTrackAudioByID, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import mdx from './UseAudioLevelStyles.mdx';
import { useBorderAudioLevel } from '../AudioLevel';
import { Avatar } from '../Avatar';
import { StoryHMSProviderWrapper } from '../common/HMSProviderWrapper';
import { Box, Flex } from '../Layout';
import { Slider } from '../Slider';
import { StoryBookSDK } from '../store/StorybookSDK';
import { Text } from '../Text';

const AudioLevelStyles = () => {
  const trackId = '101';
  const ref = useBorderAudioLevel(trackId);

  // ignore: use to simulate changing speaker audio levels
  const currVolume = useHMSStore(selectTrackAudioByID(trackId));
  const actions = useHMSActions() as unknown as StoryBookSDK;

  const username = 'John Doe';
  return (
    <Box>
      <Flex
        ref={ref}
        justify="center"
        align="center"
        direction="column"
        css={{ bg: '$bgSecondary', height: '300px', maxWidth: '300px', mb: '$4', r: '$2' }}
      >
        <Avatar name={username} css={{ width: '100px', height: '100px', mb: '$4' }} />
        <Text>{username}</Text>
      </Flex>
      <Text>Set Audio Level</Text>
      <Slider
        defaultValue={[0]}
        step={1}
        value={[currVolume]}
        onValueChange={e => actions.setAudioLevel(e[0], trackId)}
        css={{ width: '300px' }}
      />
    </Box>
  );
};

const Template = () => {
 return (
  <StoryHMSProviderWrapper>
    <AudioLevelStyles />
  </StoryHMSProviderWrapper>
 );
}

const AudioLevelStylesStory = {
  title: 'Hooks/useAudioLevelStyles',
  component: Template,
  parameters: {
    docs: {
      page: mdx,
    },
  },
};

export default AudioLevelStylesStory;

export const UseAudioLevelStyles = Template.bind({});
UseAudioLevelStyles.storyName = 'useAudioLevelStyles';
