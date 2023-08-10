import React from 'react';
import { useMedia } from 'react-use';
import { config as cssConfig, Footer as AppFooter } from '../../../';
import { AudioVideoToggle } from '../AudioVideoToggle';
import { EmojiReaction } from '../EmojiReaction';
import { LeaveRoom } from '../LeaveRoom';
import { MoreSettings } from '../MoreSettings/MoreSettings';
import { ScreenshareToggle } from '../ScreenShare';
import { ChatToggle } from './ChatToggle';
import { ParticipantCount } from './ParticipantList';

export const StreamingFooter = () => {
  const isMobile = useMedia(cssConfig.media.md);
  return (
    <AppFooter.Root
      css={{
        flexWrap: 'nowrap',
        '@md': {
          justifyContent: 'center',
          gap: '$10',
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
        {isMobile ? <LeaveRoom /> : null}
        <AudioVideoToggle hideOptions />
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
            <ChatToggle />
            <MoreSettings />
          </>
        ) : (
          <>
            <ScreenshareToggle />
            <EmojiReaction />
            <LeaveRoom />
          </>
        )}
      </AppFooter.Center>
      <AppFooter.Right>
        <ChatToggle />
        <ParticipantCount />
        <MoreSettings />
      </AppFooter.Right>
    </AppFooter.Root>
  );
};
