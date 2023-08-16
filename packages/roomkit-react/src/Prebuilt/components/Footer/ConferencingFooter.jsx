import React, { Suspense } from 'react';
import { useMedia } from 'react-use';
import { selectIsLocalVideoEnabled, useHMSStore } from '@100mslive/react-sdk';
import { config as cssConfig, Footer as AppFooter } from '../../../';
import { AudioVideoToggle } from '../AudioVideoToggle';
import { EmojiReaction } from '../EmojiReaction';
import { LeaveRoom } from '../LeaveRoom';
import { MoreSettings } from '../MoreSettings/MoreSettings';
import { ScreenshareToggle } from '../ScreenShareToggle';
import { ChatToggle } from './ChatToggle';
import { ParticipantCount } from './ParticipantList';
import { FeatureFlags } from '../../services/FeatureFlags';

const TranscriptionButton = React.lazy(() => import('../../plugins/transcription'));
const VirtualBackground = React.lazy(() => import('../../plugins/VirtualBackground/VirtualBackground'));

export const ConferencingFooter = () => {
  const isMobile = useMedia(cssConfig.media.md);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);

  return (
    <AppFooter.Root css={{ '@md': { gap: '$10' } }}>
      {isMobile ? (
        <>
          <AppFooter.Center css={{ gap: '$10' }}>
            <LeaveRoom />
            <AudioVideoToggle hideOptions />
            <ChatToggle />
            <MoreSettings />
          </AppFooter.Center>
        </>
      ) : (
        <>
          <AppFooter.Left>
            {isVideoOn ? (
              <Suspense fallback="">
                <VirtualBackground />
              </Suspense>
            ) : null}
            {FeatureFlags.enableTranscription ? <TranscriptionButton /> : null}
          </AppFooter.Left>
          <AppFooter.Center>
            <AudioVideoToggle hideOptions />
            <ScreenshareToggle />
            <EmojiReaction />
            <LeaveRoom />
          </AppFooter.Center>
          <AppFooter.Right>
            <ChatToggle />
            <ParticipantCount />
            <MoreSettings />
          </AppFooter.Right>
        </>
      )}
    </AppFooter.Root>
  );
};
