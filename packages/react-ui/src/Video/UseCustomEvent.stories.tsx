import { StyledVideo } from './Video';
import { ComponentStory } from '@storybook/react';
import { useCustomEvent } from '@100mslive/react-sdk';
import { useCallback, useState } from 'react';
import { Toast } from '../Toast';

const VideoHook: ComponentStory<typeof StyledVideo> = () => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ emoji: string }>();

  const handleEmojiReaction = useCallback((data: any) => {
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
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
};

export default VideoStories;

export const UseVideoHook = VideoHook.bind({});
UseVideoHook.storyName = 'useCustomEvent';
