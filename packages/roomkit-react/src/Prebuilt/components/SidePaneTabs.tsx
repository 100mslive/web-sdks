import React, { useEffect, useState } from 'react';
import { useMedia } from 'react-use';
import { DefaultConferencingScreen_Elements } from '@100mslive/types-prebuilt';
import { selectPeerCount, useHMSStore } from '@100mslive/react-sdk';
import { CrossIcon } from '@100mslive/react-icons';
// @ts-ignore: No implicit Any
import { Chat } from './Chat/Chat';
import { PaginatedParticipants } from './Footer/PaginatedParticipants';
import { ParticipantList } from './Footer/ParticipantList';
import { Box, config as cssConfig, Flex, IconButton, Tabs, Text } from '../..';
import { Tooltip } from '../../Tooltip';
import { ChatSettings } from './ChatSettings';
// @ts-ignore: No implicit Any
import { useRoomLayoutConferencingScreen } from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore: No implicit Any
import { useIsSidepaneTypeOpen, useSidepaneReset, useSidepaneToggle } from './AppData/useSidepane';
// @ts-ignore: No implicit Any
import { getFormattedCount } from '../common/utils';
import { SIDE_PANE_OPTIONS } from '../common/constants';

const tabTriggerCSS = {
  color: '$on_surface_high',
  p: '$4',
  fontWeight: '$semiBold',
  fontSize: '$sm',
  w: '100%',
  justifyContent: 'center',
};

const ParticipantCount = ({ count }: { count: number }) => {
  return count < 1000 ? (
    <span>({count})</span>
  ) : (
    <Tooltip title={count}>
      <span>({getFormattedCount(count)})</span>
    </Tooltip>
  );
};

export const SidePaneTabs = React.memo<{
  active: 'Participants | Chat';
  hideControls?: boolean;
  hideTab?: boolean;
}>(({ active = SIDE_PANE_OPTIONS.CHAT, hideControls, hideTab = false }) => {
  const toggleChat = useSidepaneToggle(SIDE_PANE_OPTIONS.CHAT);
  const toggleParticipants = useSidepaneToggle(SIDE_PANE_OPTIONS.PARTICIPANTS);
  const resetSidePane = useSidepaneReset();
  const [activeTab, setActiveTab] = useState(active);
  const [activeRole, setActiveRole] = useState('');
  const peerCount = useHMSStore(selectPeerCount);
  const { elements, screenType } = useRoomLayoutConferencingScreen();
  const chat_title = elements?.chat?.chat_title || 'Chat';
  const showChat = !!elements?.chat;
  const showParticipants = !!elements?.participant_list;
  const hideTabs = !(showChat && showParticipants) || hideTab;
  const isMobile = useMedia(cssConfig.media.md);
  const isOverlayChat = !!elements?.chat?.is_overlay && isMobile;
  const { off_stage_roles = [] } = (elements as DefaultConferencingScreen_Elements)?.on_stage_exp || {};
  const isChatOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.CHAT);
  const showChatSettings = showChat && isChatOpen && (!isMobile || !isOverlayChat);

  useEffect(() => {
    if (activeTab === SIDE_PANE_OPTIONS.CHAT && !showChat && showParticipants) {
      setActiveTab(SIDE_PANE_OPTIONS.PARTICIPANTS);
    } else if (activeTab === SIDE_PANE_OPTIONS.PARTICIPANTS && showChat && !showParticipants) {
      setActiveTab(SIDE_PANE_OPTIONS.CHAT);
    } else if (!showChat && !showParticipants) {
      resetSidePane();
    }
  }, [showChat, activeTab, showParticipants, resetSidePane]);

  useEffect(() => {
    setActiveTab(active);
  }, [active]);

  if (activeRole) {
    return (
      <Flex
        direction="column"
        css={{
          color: '$on_primary_high',
          h: '100%',
          marginTop: hideControls && isOverlayChat ? '$17' : '0',
          transition: 'margin 0.3s ease-in-out',
          position: 'relative',
        }}
      >
        <Box css={{ position: 'absolute', left: 0, top: 0, size: '100%', zIndex: 21, bg: '$surface_dim' }}>
          <PaginatedParticipants roleName={activeRole} onBack={() => setActiveRole('')} />
        </Box>
      </Flex>
    );
  }

  return (
    <Flex
      direction="column"
      css={{
        color: '$on_primary_high',
        h: '100%',
        marginTop: hideControls && isOverlayChat ? '$17' : '0',
        transition: 'margin 0.3s ease-in-out',
      }}
    >
      {isOverlayChat && isChatOpen && showChat ? (
        <Chat />
      ) : (
        <>
          {hideTabs ? (
            <>
              <Flex justify="between" css={{ w: '100%', '&:empty': { display: 'none' } }}>
                <Text
                  variant="sm"
                  css={{
                    fontWeight: '$semiBold',
                    p: '$4',
                    c: '$on_surface_high',
                    pr: '$12',
                    '&:empty': { display: 'none' },
                  }}
                >
                  {activeTab === SIDE_PANE_OPTIONS.CHAT ? (
                    screenType !== 'hls_live_streaming' && chat_title
                  ) : (
                    <span>
                      Participants&nbsp;
                      <ParticipantCount count={peerCount} />
                    </span>
                  )}
                </Text>
                <Flex>
                  {showChatSettings ? <ChatSettings /> : null}
                  {isOverlayChat && isChatOpen ? null : (
                    <IconButton
                      css={{
                        my: '$1',
                        color: '$on_surface_medium',
                        '&:hover': { color: '$on_surface_high' },
                        '&:empty': { display: 'none' },
                      }}
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
                      {screenType === 'hls_live_streaming' && isChatOpen ? null : <CrossIcon />}
                    </IconButton>
                  )}
                </Flex>
              </Flex>
              {activeTab === SIDE_PANE_OPTIONS.CHAT ? (
                <Chat />
              ) : (
                <ParticipantList offStageRoles={off_stage_roles} onActive={setActiveRole} />
              )}
            </>
          ) : (
            <Tabs.Root
              value={activeTab}
              onValueChange={setActiveTab}
              css={{
                flexDirection: 'column',
                size: '100%',
              }}
            >
              <Flex css={{ w: '100%' }}>
                <Tabs.List css={{ flexGrow: 1, borderRadius: '$2', bg: '$surface_default' }}>
                  <Tabs.Trigger
                    value={SIDE_PANE_OPTIONS.CHAT}
                    onClick={toggleChat}
                    css={{
                      ...tabTriggerCSS,
                      color: activeTab !== SIDE_PANE_OPTIONS.CHAT ? '$on_surface_low' : '$on_surface_high',
                    }}
                  >
                    {chat_title}
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value={SIDE_PANE_OPTIONS.PARTICIPANTS}
                    onClick={toggleParticipants}
                    css={{
                      ...tabTriggerCSS,
                      color: activeTab !== SIDE_PANE_OPTIONS.PARTICIPANTS ? '$on_surface_low' : '$on_surface_high',
                    }}
                  >
                    Participants&nbsp;
                    <ParticipantCount count={peerCount} />
                  </Tabs.Trigger>
                </Tabs.List>
                {showChatSettings ? <ChatSettings /> : null}
                {isOverlayChat && isChatOpen ? null : (
                  <IconButton
                    css={{ my: '$1', color: '$on_surface_medium', '&:hover': { color: '$on_surface_high' } }}
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
                )}
              </Flex>
              <Tabs.Content value={SIDE_PANE_OPTIONS.PARTICIPANTS} css={{ p: 0 }}>
                <ParticipantList offStageRoles={off_stage_roles} onActive={setActiveRole} />
              </Tabs.Content>
              <Tabs.Content value={SIDE_PANE_OPTIONS.CHAT} css={{ p: 0 }}>
                <Chat />
              </Tabs.Content>
            </Tabs.Root>
          )}
        </>
      )}
    </Flex>
  );
});
