import React, { useState } from 'react';
import { Flex } from '../../../Layout';
import { FeedbackHeader, FeedbackModal } from './FeedbackForm';
import { useRoomLayoutLeaveScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';

export const Feedback = () => {
  // TODO - use roomLayoutLeaveScreen
  const { feedback } = useRoomLayoutLeaveScreen();
  const [index, setIndex] = useState(-1);

  if (!feedback) {
    return null;
  }
  const { ratings } = feedback;
  if (!ratings) {
    return null;
  }
  ratings.sort((a, b) => {
    if (!a.value || !b.value) {
      return 0;
    }
    return a.value - b.value;
  });
  return (
    <Flex
      justify="center"
      css={{
        pt: '$16',
        w: '528px',
      }}
    >
      {index === -1 ? (
        <Flex
          css={{
            p: '$12',
            border: '1px solid $border_default',
            bg: '$surface_dim',
            r: '$3',
            gap: '$10',
          }}
          direction="column"
        >
          <FeedbackHeader ratings={ratings} onEmojiClicked={setIndex} />
        </Flex>
      ) : (
        <FeedbackModal ratings={ratings} index={index} setIndex={setIndex} />
      )}
    </Flex>
  );
};
