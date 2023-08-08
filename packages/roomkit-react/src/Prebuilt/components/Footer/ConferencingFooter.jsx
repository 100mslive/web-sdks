import React, { Suspense } from 'react';
import { useMedia } from 'react-use';
import { config as cssConfig, Footer as AppFooter } from '../../../';
import { AudioVideoToggle } from '../AudioVideoToggle';
import { EmojiReaction } from '../EmojiReaction';
import { LeaveRoom } from '../LeaveRoom';
import { MoreSettings } from '../MoreSettings/MoreSettings';
import { ScreenshareToggle } from '../ScreenShare';
import { ChatToggle } from './ChatToggle';
import { ParticipantCount } from './ParticipantList';
import { FeatureFlags } from '../../services/FeatureFlags';

const TranscriptionButton = React.lazy(() => import('../../plugins/transcription'));
const VirtualBackground = React.lazy(() => import('../../plugins/VirtualBackground/VirtualBackground'));

export const ConferencingFooter = () => {
  const isMobile = useMedia(cssConfig.media.md);
  return (
    <AppFooter.Root>
      {isMobile ? (
        <>
          <AppFooter.Center>
            <LeaveRoom />
            <AudioVideoToggle hideOptions />
            <ChatToggle />
            <MoreSettings />
          </AppFooter.Center>
        </>
      ) : (
        <>
          <AppFooter.Left>
            <Suspense fallback="">
              <VirtualBackground />
            </Suspense>
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
