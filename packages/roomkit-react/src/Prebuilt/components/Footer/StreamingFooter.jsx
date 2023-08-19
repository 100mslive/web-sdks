import React from 'react';
import { useMedia } from 'react-use';
import { selectLocalPeerRoleName, useHMSStore } from '@100mslive/react-sdk';
import { HandIcon } from '@100mslive/react-icons';
import { config as cssConfig, Footer as AppFooter, Tooltip } from '../../../';
import IconButton from '../../IconButton';
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

export const StreamingFooter = () => {
  const isMobile = useMedia(cssConfig.media.md);
  const isHandRaiseEnabled = useIsFeatureEnabled(FEATURE_LIST.HAND_RAISE);
  const localPeerRole = useHMSStore(selectLocalPeerRoleName);
  const hlsViewerRole = useHLSViewerRole();
  const isHlsViewer = hlsViewerRole === localPeerRole;
  const { isHandRaised, toggleHandRaise } = useMyMetadata();

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
            {isHandRaiseEnabled && isHlsViewer ? (
              <IconButton active={!isHandRaised} onClick={toggleHandRaise}>
                <HandIcon />
              </IconButton>
            ) : null}
            <ChatToggle />
            <MoreSettings />
          </>
        ) : (
          <>
            <ScreenshareToggle />
            {isHandRaiseEnabled && isHlsViewer ? (
              <Tooltip title={isHandRaised ? 'Lower hand' : 'Raise hand'}>
                <IconButton active={!isHandRaised} onClick={toggleHandRaise}>
                  <HandIcon />
                </IconButton>
              </Tooltip>
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
