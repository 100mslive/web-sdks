import React from 'react';
import { StyledVideo } from '../Video/Video';
import { ComponentStory } from '@storybook/react';
import { useCustomEvent } from '@100mslive/react-sdk';
import { useCallback, useState } from 'react';
import { Toast } from '../Toast/Toast';
import mdx from './UseCustomEvent.mdx';

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
      <button onClick={() => sendEvent({ emoji: '🚀' })}>Rockets</button>
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

const VideoStories = {
  title: 'Hooks/useCustomEvent',
  component: VideoHook,
  parameters: {
    docs: {
      page: mdx,
    },
  },
};

export default VideoStories;

export const UseVideoHook = VideoHook.bind({});
UseVideoHook.storyName = 'useCustomEvent';
