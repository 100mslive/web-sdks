import React, { useState } from 'react';
import { CrossIcon } from '@100mslive/react-icons';
import { Flex, IconButton, Tabs } from '../../..';
import { useSidepaneToggle } from '../AppData/useSidepane';
import { SIDE_PANE_OPTIONS } from '../../common/constants';

const tabTriggerCSS = {
  color: '$on_surface_high',
  p: '$4',
  fontWeight: '$semiBold',
  fontSize: '$sm',
  w: '100%',
  justifyContent: 'center',
};

export const ChatParticipantHeader = React.memo(({ activeTabValue = SIDE_PANE_OPTIONS.CHAT }) => {
  const toggleChat = useSidepaneToggle(SIDE_PANE_OPTIONS.CHAT);
  const toggleParticipants = useSidepaneToggle(SIDE_PANE_OPTIONS.PARTICIPANTS);
  const [activeTab, setActiveTab] = useState(activeTabValue);

  return (
    <Flex
      align="center"
      css={{
        color: '$on_primary_high',
        h: '$16',
        mb: '$2',
      }}
    >
      <Flex css={{ w: '100%', bg: '$surface_default', borderRadius: '$2' }}>
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} css={{ w: '100%' }}>
          <Tabs.List css={{ w: '100%', p: '$2' }}>
            <Tabs.Trigger
              value={SIDE_PANE_OPTIONS.CHAT}
              onClick={toggleChat}
              css={{
                ...tabTriggerCSS,
                color: activeTab !== SIDE_PANE_OPTIONS.CHAT ? '$on_surface_low' : '$on_surface_high',
              }}
            >
              Chat
            </Tabs.Trigger>
            <Tabs.Trigger
              value={SIDE_PANE_OPTIONS.PARTICIPANTS}
              onClick={toggleParticipants}
              css={{
                ...tabTriggerCSS,
                color: activeTab !== SIDE_PANE_OPTIONS.PARTICIPANTS ? '$on_surface_low' : '$on_surface_high',
              }}
            >
              Participants
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </Flex>
      <IconButton
        css={{ ml: 'auto' }}
        onClick={e => {
          e.stopPropagation();
          if (activeTab === SIDE_PANE_OPTIONS.CHAT) {
            toggleChat();
          } else {
            toggleParticipants();
          }
        }}
        data-testid="close_chat"
      >
        <CrossIcon />
      </IconButton>
    </Flex>
  );
});
