import React from 'react';
import { CrossIcon } from '@100mslive/react-icons';
import { Flex, IconButton, Text } from '../../../';
import { useSidepaneToggle } from '../AppData/useSidepane';
import { SIDE_PANE_OPTIONS } from '../../common/constants';

export const ChatHeader = React.memo(({ selectorOpen, onToggle }) => {
  const toggleChat = useSidepaneToggle(SIDE_PANE_OPTIONS.CHAT);
  return (
    <Flex
      onClick={onToggle}
      align="center"
      css={{
        color: '$on_primary_high',
        h: '$16',
        mb: '$2',
      }}
    >
      <Text variant="h6">Chat </Text>
      <IconButton
        css={{ ml: 'auto' }}
        onClick={e => {
          e.stopPropagation();
          selectorOpen ? onToggle() : toggleChat();
        }}
        data-testid="close_chat"
      >
        <CrossIcon />
      </IconButton>
    </Flex>
  );
});
