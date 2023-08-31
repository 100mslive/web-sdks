import React from 'react';
import { useMedia } from 'react-use';
import {
  ConferencingScreen,
  DefaultConferencingScreen_Elements,
  HLSLiveStreamingScreen_Elements,
} from '@100mslive/types-prebuilt';
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

export const Footer = ({
  screenType,
  elements,
}: {
  screenType: keyof ConferencingScreen;
  elements: DefaultConferencingScreen_Elements | HLSLiveStreamingScreen_Elements;
}) => {
  const isMobile = useMedia(cssConfig.media.md);

  return (
    <AppFooter.Root
      css={{
        flexWrap: 'nowrap',
        '@md': {
          justifyContent: 'center',
          gap: '$10',
          position: 'relative',
          zIndex: 20,
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
            {elements.chat && <ChatToggle />}
            <MoreSettings elements={elements} screenType={screenType} />
          </>
        ) : (
          <>
            <ScreenshareToggle />
            <RaiseHand />
            {elements.emoji_reactions && <EmojiReaction />}
            <LeaveRoom screenType={screenType} />
          </>
        )}
      </AppFooter.Center>
      <AppFooter.Right>
        {elements.chat && <ChatToggle />}
        <ParticipantCount />
        <MoreSettings elements={elements} screenType={screenType} />
      </AppFooter.Right>
    </AppFooter.Root>
  );
};
