import React from 'react';
import { useMedia } from 'react-use';
import { config as cssConfig, Flex } from '../../../';
import { EmojiReaction } from '../EmojiReaction';
import { LeaveRoom } from '../LeaveRoom';
import MetaActions from '../MetaActions';
import { SpeakerTag } from './HeaderComponents';
import { ParticipantCount } from './ParticipantList';
import { LiveStatus, RecordingStatus, StreamActions } from './StreamActions';

export const StreamingHeader = ({ isPreview }) => {
  const isMobile = useMedia(cssConfig.media.md);
  return (
    <Flex justify="between" align="center" css={{ position: 'relative', height: '100%' }}>
      <Flex
        align="center"
        css={{
          position: 'absolute',
          left: '$10',
        }}
      >
        {isMobile ? (
          <Flex align="center" gap={2}>
            <LeaveRoom />
            {!isPreview ? <LiveStatus /> : null}
            <RecordingStatus />
          </Flex>
        ) : null}
        {!isPreview ? <SpeakerTag /> : null}
      </Flex>

      <Flex
        align="center"
        css={{
          position: 'absolute',
          right: '$10',
          gap: '$4',
        }}
      >
        {isMobile ? (
          <>
            <EmojiReaction />
            <MetaActions compact />
          </>
        ) : (
          <Flex css={{ gap: '$4' }}>
            <StreamActions />
          </Flex>
        )}
        {!isPreview ? <ParticipantCount /> : null}
      </Flex>
    </Flex>
  );
};
