import React from 'react';
import { useMedia } from 'react-use';
import { selectLocalPeerRoleName, useHMSStore } from '@100mslive/react-sdk';
import { config as cssConfig, Footer as AppFooter } from '../../../';
import { AudioVideoToggle } from '../AudioVideoToggle';
import { EmojiReaction } from '../EmojiReaction';
import { LeaveRoom } from '../LeaveRoom';
import { MoreSettings } from '../MoreSettings/MoreSettings';
import { RaiseHand } from '../RaiseHand';
import { ScreenshareToggle } from '../ScreenShareToggle';
import { ChatToggle } from './ChatToggle';
import { ParticipantCount } from './ParticipantList';
import { useHLSViewerRole } from '../AppData/useUISettings';

export const Footer = () => {
  const isMobile = useMedia(cssConfig.media.md);
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const hlsViewerRole = useHLSViewerRole();
  const isHlsViewer = hlsViewerRole === localPeerRole;

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
