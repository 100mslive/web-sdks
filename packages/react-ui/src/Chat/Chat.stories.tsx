import React, { useState } from 'react';
import { selectHMSMessages, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import ChatDocs from './Chat.mdx';
import { StoryHMSProviderWrapper } from '../common/HMSProviderWrapper';

const ChatStories = {
  title: 'Chat/Broadcast Message',
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  parameters: {
    docs: {
      page: ChatDocs,
    },
  },
};

export default ChatStories;

const ChatStory = () => {
  const chats = useHMSStore(selectHMSMessages);
  const actions = useHMSActions();
  const [input, setInput] = useState('');
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    actions.sendBroadcastMessage(input);
    setInput('');
  };
  return (
    <div>
      {chats.map(c => (
        <div>{c.message}</div>
      ))}
      <form onSubmit={sendMessage}>
        <input value={input} onChange={e => setInput(e.target.value)} type="text" />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

const ChatExample = () => {
  return (
    <StoryHMSProviderWrapper>
      <ChatStory />
    </StoryHMSProviderWrapper>
  );
}
export const ChatStoryExample = ChatExample.bind({});
