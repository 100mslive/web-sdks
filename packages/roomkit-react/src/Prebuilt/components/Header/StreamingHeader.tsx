import React from 'react';
import { useMedia } from 'react-use';
import { config as cssConfig, Flex } from '../../..';
// @ts-ignore: No implicit any
import { EmojiReaction } from '../EmojiReaction';
// @ts-ignore: No implicit any
import { ParticipantCount } from '../Footer/ParticipantList';
// @ts-ignore: No implicit any
import { LeaveRoom } from '../LeaveRoom';
// @ts-ignore: No implicit any
import MetaActions from '../MetaActions';
// @ts-ignore: No implicit any
import { SpeakerTag } from './HeaderComponents';
// @ts-ignore: No implicit any
import { LiveStatus, RecordingStatus, StreamActions } from './StreamActions';

export const StreamingHeader = () => {
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
            <LiveStatus />
            <RecordingStatus />
          </Flex>
        ) : null}
        <SpeakerTag />
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
        <ParticipantCount />
      </Flex>
    </Flex>
  );
};
