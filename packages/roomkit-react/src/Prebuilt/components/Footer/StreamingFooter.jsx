import React from 'react';
import { useMedia } from 'react-use';
import { HandIcon, HandRaiseIcon } from '@100mslive/react-icons';
import { config as cssConfig, Footer as AppFooter } from '../../../';
import IconButton from '../../IconButton';
import { AudioVideoToggle } from '../AudioVideoToggle';
import { EmojiReaction } from '../EmojiReaction';
import { LeaveRoom } from '../LeaveRoom';
import { MoreSettings } from '../MoreSettings/MoreSettings';
import { ScreenshareToggle } from '../ScreenShare';
import { ChatToggle } from './ChatToggle';
import { ParticipantCount } from './ParticipantList';
import { useIsFeatureEnabled } from '../hooks/useFeatures';
import { useMyMetadata } from '../hooks/useMetadata';
import { FEATURE_LIST } from '../../common/constants';

export const StreamingFooter = () => {
  const isMobile = useMedia(cssConfig.media.md);
  const isHandRaiseEnabled = useIsFeatureEnabled(FEATURE_LIST.HAND_RAISE);
  const { isHandRaised, toggleHandRaise } = useMyMetadata();

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
            {isHandRaiseEnabled ? (
              <IconButton active={!isHandRaised} onClick={toggleHandRaise}>
                {isHandRaised ? <HandRaiseIcon /> : <HandIcon />}
              </IconButton>
            ) : null}
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
