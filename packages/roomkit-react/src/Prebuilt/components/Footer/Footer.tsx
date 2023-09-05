import React, { Suspense } from 'react';
import { useMedia } from 'react-use';
import {
  ConferencingScreen,
  DefaultConferencingScreen_Elements,
  HLSLiveStreamingScreen_Elements,
} from '@100mslive/types-prebuilt';
import { Chat_ChatState } from '@100mslive/types-prebuilt/elements/chat';
import { selectIsLocalVideoEnabled, useHMSStore } from '@100mslive/react-sdk';
import { config as cssConfig, Footer as AppFooter } from '../../..';
// @ts-ignore: No implicit Any
import { AudioVideoToggle } from '../AudioVideoToggle';
// @ts-ignore: No implicit Any
import { EmojiReaction } from '../EmojiReaction';
// @ts-ignore: No implicit Any
import { LeaveRoom } from '../Leave/LeaveRoom';
// @ts-ignore: No implicit Any
import { MoreSettings } from '../MoreSettings/MoreSettings';
// @ts-ignore: No implicit Any
import { RaiseHand } from '../RaiseHand';
// @ts-ignore: No implicit Any
import { ScreenshareToggle } from '../ScreenShareToggle';
// @ts-ignore: No implicit Any
import { ChatToggle } from './ChatToggle';
// @ts-ignore: No implicit Any
import { ParticipantCount } from './ParticipantList';
// @ts-ignore: No implicit Any
const VirtualBackground = React.lazy(() => import('../../plugins/VirtualBackground/VirtualBackground'));

export const Footer = ({
  screenType,
  elements,
}: {
  screenType: keyof ConferencingScreen;
  elements: DefaultConferencingScreen_Elements | HLSLiveStreamingScreen_Elements;
}) => {
  const isMobile = useMedia(cssConfig.media.md);
  const isOverlayChat = !!elements?.chat?.is_overlay;
  const openByDefault = elements?.chat?.initial_state === Chat_ChatState.CHAT_STATE_OPEN;
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);

  return (
    <AppFooter.Root
      css={{
        flexWrap: 'nowrap',
        '@md': {
          justifyContent: 'center',
          gap: '$10',
          position: 'relative',
          // To prevent it from showing over the sidepane if chat type is not overlay
          zIndex: isOverlayChat ? 20 : 1,
        },
      }}
    >
      <AppFooter.Left
        css={{
          '@md': {
            w: 'unset',
            p: '0',
            gap: '$10',
          },
        }}
      >
        {isMobile ? <LeaveRoom screenType={screenType} /> : null}
        <AudioVideoToggle />
        {isMobile ? null : <Suspense fallback={<></>}>{isVideoOn ? <VirtualBackground /> : null}</Suspense>}
      </AppFooter.Left>
      <AppFooter.Center
        css={{
          '@md': {
            w: 'unset',
            gap: '$10',
          },
        }}
      >
        {isMobile ? (
          <>
            {screenType === 'hls_live_streaming' ? <RaiseHand /> : null}
            {elements?.chat && <ChatToggle openByDefault={openByDefault} />}
            <MoreSettings elements={elements} screenType={screenType} />
          </>
        ) : (
          <>
            <ScreenshareToggle />
            <RaiseHand />
            {elements?.emoji_reactions && <EmojiReaction />}
            <LeaveRoom screenType={screenType} />
          </>
        )}
      </AppFooter.Center>
      <AppFooter.Right>
        {elements?.chat && <ChatToggle openByDefault={openByDefault} />}
        {elements?.participant_list && <ParticipantCount />}
        <MoreSettings elements={elements} screenType={screenType} />
      </AppFooter.Right>
    </AppFooter.Root>
  );
};
