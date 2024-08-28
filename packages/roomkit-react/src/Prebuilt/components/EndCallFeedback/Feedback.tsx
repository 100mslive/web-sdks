import React, { useState } from 'react';
import { useMedia } from 'react-use';
import { Flex } from '../../../Layout';
import { config as cssConfig } from '../../../Theme';
import { FeedbackHeader, FeedbackModal } from './FeedbackForm';
import { ThankyouView } from './ThankyouView';
import { useRoomLayoutLeaveScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';

export const Feedback = () => {
  const { feedback } = useRoomLayoutLeaveScreen();
  const [index, setIndex] = useState(-1);
  const isMobile = useMedia(cssConfig.media.md);

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
  if (index === -10) {
    return (
      <Flex
        justify="center"
        css={{
          pt: '$16',
        }}
      >
        <ThankyouView />
      </Flex>
    );
  }
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
            borderRadius: !isMobile ? '$3' : '$3 $3 0 0',
            gap: '$10',
            '@md': {
              position: 'absolute',
              bottom: '0',
            },
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
