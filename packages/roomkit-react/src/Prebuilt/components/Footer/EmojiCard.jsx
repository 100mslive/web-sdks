import React from 'react';
import { Flex } from '../../../Layout';
import { styled } from '../../../Theme';

// When changing emojis in the grid, keep in mind that the payload used in sendHLSTimedMetadata has a limit of 100 characters. Using bigger emoji Ids can cause the limit to be exceeded.
const emojiReactionList = [
  [{ emojiId: '+1' }, { emojiId: '-1' }, { emojiId: 'wave' }, { emojiId: 'clap' }, { emojiId: 'fire' }],
  [{ emojiId: 'tada' }, { emojiId: 'heart' }, { emojiId: 'joy' }, { emojiId: 'open_mouth' }, { emojiId: 'sob' }],
];

export const EmojiCard = ({ sendReaction }) => {
  return emojiReactionList.map((emojiLine, index) => (
    <Flex key={index} justify="between" css={{ mb: '$8' }}>
      {emojiLine.map(emoji => (
        <EmojiContainer key={emoji.emojiId} onClick={() => sendReaction(emoji.emojiId)}>
          <em-emoji id={emoji.emojiId} size="100%" set="apple"></em-emoji>
        </EmojiContainer>
      ))}
    </Flex>
  ));
};

const EmojiContainer = styled('span', {
  position: 'relative',
  cursor: 'pointer',
  width: '$16',
  height: '$16',
  p: '$4',
  '&:hover': {
    p: '7px',
    bg: '$surface_brighter',
    borderRadius: '$1',
  },
});
