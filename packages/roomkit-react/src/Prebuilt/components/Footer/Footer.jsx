import React from 'react';
import { useMedia } from 'react-use';
import { selectLocalPeerRoleName, useHMSStore } from '@100mslive/react-sdk';
import { config as cssConfig, Footer as AppFooter } from '../../..';
import { AudioVideoToggle } from '../AudioVideoToggle';
import { EmojiReaction } from '../EmojiReaction';
import { LeaveRoom } from '../LeaveRoom';
import { MoreSettings } from '../MoreSettings/MoreSettings';
import { ScreenshareToggle } from '../ScreenShare';
import { ChatToggle } from './ChatToggle';
import { ParticipantCount } from './ParticipantList';
import { useHLSViewerRole } from '../AppData/useUISettings';
import { useIsFeatureEnabled } from '../hooks/useFeatures';
import { useMyMetadata } from '../hooks/useMetadata';
import { FEATURE_LIST } from '../../common/constants';
import { RaiseHand } from '../RaiseHand';

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
