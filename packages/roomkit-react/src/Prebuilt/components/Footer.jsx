import React from 'react';
import { useMedia } from 'react-use';
import { ChatToggle } from './Footer/ChatToggle';
import { ParticipantCount } from './Footer/ParticipantList';
import { MoreSettings } from './MoreSettings/MoreSettings';
import { Footer as AppFooter } from '../../Footer';
import { config as cssConfig } from '../../Theme';
import { AudioVideoToggle } from './AudioVideoToggle';
import { EmojiReaction } from './EmojiReaction';
import { LeaveRoom } from './LeaveRoom';
import { RaiseHand } from './RaiseHand';
import { ScreenshareToggle } from './ScreenShare';
import { useIsLocalPeerHLSViewer } from '../common/hooks';

export const Footer = () => {
  const isMobile = useMedia(cssConfig.media.md);
  const isHlsViewer = useIsLocalPeerHLSViewer();

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
        {isMobile ? <LeaveRoom /> : null}
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
            {isHlsViewer ? <RaiseHand /> : null}
            <ChatToggle />
            <MoreSettings />
          </>
        ) : (
          <>
            <ScreenshareToggle />
            {isHlsViewer ? <RaiseHand /> : null}
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
