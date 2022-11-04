import React, { useCallback, useState } from 'react';
import { ComponentStory } from '@storybook/react';
import { useCustomEvent } from '@100mslive/react-sdk';
import mdx from './UseCustomEvent.mdx';
import { Button } from '../Button';
import { StoryHMSProviderWrapper } from '../common/HMSProviderWrapper';
import { Toast } from '../Toast/Toast';
import { StyledVideo } from '../Video/Video';

const VideoHook: ComponentStory<typeof StyledVideo> = () => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ emoji: string }>();

  const handleEmojiReaction = useCallback((data: { emoji: string }) => {
    setOpen(true);
    setData(data);
  }, []);

  const { sendEvent } = useCustomEvent({
    type: 'EMOJI_REACTION',
    onEvent: handleEmojiReaction,
  });

  return (
    <Toast.Provider>
      <Button onClick={() => sendEvent({ emoji: '🚀' })}>Rockets</Button>
      <Toast.HMSToast
        title="EMOJI_REACTION"
        description={JSON.stringify(data)}
        open={open}
        isClosable={true}
        onOpenChange={o => setOpen(o)}
      />
      <Toast.Viewport css={{ bottom: '$24' }} />
    </Toast.Provider>
  );
};

const Template = () => {
 return (
  <StoryHMSProviderWrapper>
    <VideoHook />
  </StoryHMSProviderWrapper>
 );
}

const VideoStories = {
  title: 'Hooks/useCustomEvent',
  component: Template,
  parameters: {
    docs: {
      page: mdx,
    },
  },
};

export default VideoStories;

export const UseVideoHook = Template.bind({});
UseVideoHook.storyName = 'useCustomEvent';
