import React, { useEffect } from 'react';
import { DefaultConferencingScreen_Elements } from '@100mslive/types-prebuilt';
import { Chat_ChatState } from '@100mslive/types-prebuilt/elements/chat';
import { selectUnreadHMSMessagesCount, useHMSStore } from '@100mslive/react-sdk';
import { ChatIcon, ChatUnreadIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../..';
// @ts-ignore: No implicit Any
import IconButton from '../../IconButton';
// @ts-ignore: No implicit Any
import { useIsSidepaneTypeOpen, useSidepaneToggle } from '../AppData/useSidepane';
// @ts-ignore: No implicit Any
import { SIDE_PANE_OPTIONS } from '../../common/constants';

export const ChatToggle = ({ chatElement }: { chatElement: DefaultConferencingScreen_Elements['chat'] }) => {
  const openByDefault = chatElement?.initial_state === Chat_ChatState.CHAT_STATE_OPEN;
  const countUnreadMessages = useHMSStore(selectUnreadHMSMessagesCount);
  const isChatOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.CHAT);
  const toggleChat = useSidepaneToggle(SIDE_PANE_OPTIONS.CHAT);

  useEffect(() => {
    if (!isChatOpen && openByDefault) {
      toggleChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggleChat, openByDefault]);

  return (
    <Tooltip key="chat" title={`${isChatOpen ? 'Close' : 'Open'} chat`}>
      <IconButton onClick={toggleChat} active={!isChatOpen} data-testid="chat_btn">
        {countUnreadMessages === 0 ? <ChatIcon /> : <ChatUnreadIcon data-testid="chat_unread_btn" />}
      </IconButton>
    </Tooltip>
  );
};
