import React from 'react';
import { selectUnreadHMSMessagesCount, useHMSStore } from '@100mslive/react-sdk';
import { ChatIcon } from '@100mslive/react-icons';
import { Box, Flex, Text, Tooltip } from '../../..';
// @ts-ignore: No implicit Any
import IconButton from '../../IconButton';
// @ts-ignore: No implicit Any
import { useIsSidepaneTypeOpen, useSidepaneToggle } from '../AppData/useSidepane';
// @ts-ignore: No implicit Any
import { SIDE_PANE_OPTIONS } from '../../common/constants';

export const ChatToggle = ({ onClick }: { onClick?: () => void }) => {
  const countUnreadMessages = useHMSStore(selectUnreadHMSMessagesCount);
  const isChatOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.CHAT);
  const toggleChat = useSidepaneToggle(SIDE_PANE_OPTIONS.CHAT);

  return (
    <Box
      css={{
        position: 'relative',
      }}
    >
      <Tooltip key="chat" title={`${isChatOpen ? 'Close' : 'Open'} chat`}>
        <IconButton
          onClick={() => (onClick ? onClick() : toggleChat())}
          css={{ bg: isChatOpen ? '$surface_brighter' : '' }}
          data-testid="chat_btn"
        >
          <ChatIcon />
        </IconButton>
      </Tooltip>
      {countUnreadMessages > 0 && (
        <Flex
          css={{
            height: '$8',
            p: '$4 4.5px',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            top: '-$4',
            right: '-$4',
            borderRadius: '$space$14',
            background: '$primary_default',
          }}
        >
          <Text variant="overline" css={{ color: '$on_primary_high' }}>
            {countUnreadMessages > 99 ? '99+' : countUnreadMessages}
          </Text>
        </Flex>
      )}
    </Box>
  );
};
