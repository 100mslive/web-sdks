import React, { useEffect } from 'react';
import { ConferencingScreen } from '@100mslive/types-prebuilt';
import { Chat_ChatState } from '@100mslive/types-prebuilt/elements/chat';
import { config as cssConfig, Footer as AppFooter } from '../../..';
// @ts-ignore: No implicit Any
import { AudioVideoToggle } from '../AudioVideoToggle';
import { CaptionIcon } from '../CaptionIcon';
// @ts-ignore: No implicit Any
import { EmojiReaction } from '../EmojiReaction';
// @ts-ignore: No implicit Any
import { LeaveRoom } from '../Leave/LeaveRoom';
// @ts-ignore: No implicit Any
import { MoreSettings } from '../MoreSettings/MoreSettings';
import { RaiseHand } from '../RaiseHand';
// @ts-ignore: No implicit Any
import { ScreenshareToggle } from '../ScreenShareToggle';
// @ts-ignore: No implicit Any
import { VBToggle } from '../VirtualBackground/VBToggle';
// @ts-ignore: No implicit Any
import { ChatToggle } from './ChatToggle';
import { ParticipantCount } from './ParticipantList';
import { PollsToggle } from './PollsToggle';
import { WhiteboardToggle } from './WhiteboardToggle';
import { useMedia } from '../../common/useMediaOverride';
import { ConferencingScreenElements } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore: No implicit Any
import { useIsSidepaneTypeOpen, useSidepaneToggle } from '../AppData/useSidepane';
// @ts-ignore: No implicit Any
import { useShowPolls } from '../AppData/useUISettings';
import { getMobileStyles } from '../../common/cssUtils';
// @ts-ignore: No implicit Any
import { SIDE_PANE_OPTIONS } from '../../common/constants';

export const Footer = ({
  screenType,
  elements,
}: {
  screenType: keyof ConferencingScreen;
  elements: ConferencingScreenElements;
}) => {
  const isMobile = useMedia(cssConfig.media.md);
  const isOverlayChat = !!elements?.chat?.is_overlay;
  const openByDefault = elements?.chat?.initial_state === Chat_ChatState.CHAT_STATE_OPEN;

  const isChatOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.CHAT);
  const toggleChat = useSidepaneToggle(SIDE_PANE_OPTIONS.CHAT);
  const { showPolls } = useShowPolls();

  useEffect(() => {
    if (!isChatOpen && openByDefault) {
      toggleChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggleChat, openByDefault]);

  return (
    <AppFooter.Root
      css={{
        flexWrap: 'nowrap',
        ...getMobileStyles({
          justifyContent: 'center',
          gap: '$10',
          position: 'relative',
          // To prevent it from showing over the sidepane if chat type is not overlay
          zIndex: isOverlayChat && isChatOpen ? 20 : 1,
        }),
        '@md': {
          justifyContent: 'center',
          gap: '$10',
          position: 'relative',
          // To prevent it from showing over the sidepane if chat type is not overlay
          zIndex: isOverlayChat && isChatOpen ? 20 : 1,
        },
      }}
    >
      <AppFooter.Left
        css={{
          ...getMobileStyles({
            w: 'unset',
            p: '0',
            gap: '$10',
          }),
          '@md': {
            w: 'unset',
            p: '0',
            gap: '$10',
          },
        }}
      >
        {isMobile ? <LeaveRoom screenType={screenType} /> : null}
        <AudioVideoToggle />
        {!isMobile && elements.virtual_background ? <VBToggle /> : null}
      </AppFooter.Left>
      <AppFooter.Center
        css={{
          ...getMobileStyles({
            w: 'unset',
            gap: '$10',
          }),
          '@md': {
            w: 'unset',
            gap: '$10',
          },
        }}
      >
        {isMobile ? (
          <>
            <ScreenshareToggle />
            <RaiseHand />
            {elements?.chat && <ChatToggle />}
            <MoreSettings elements={elements} screenType={screenType} />
          </>
        ) : (
          <>
            <ScreenshareToggle />
            <RaiseHand />
            {screenType !== 'hls_live_streaming' && <CaptionIcon />}
            {elements?.emoji_reactions && <EmojiReaction />}
            <LeaveRoom screenType={screenType} />
          </>
        )}
      </AppFooter.Center>
      <AppFooter.Right>
        <WhiteboardToggle />
        {showPolls && <PollsToggle />}
        {!isMobile && elements?.chat && <ChatToggle />}
        {elements?.participant_list && <ParticipantCount />}
        <MoreSettings elements={elements} screenType={screenType} />
      </AppFooter.Right>
    </AppFooter.Root>
  );
};
