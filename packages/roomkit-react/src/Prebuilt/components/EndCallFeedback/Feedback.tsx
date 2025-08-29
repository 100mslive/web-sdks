import React, { useState } from 'react';
import { Flex } from '../../../Layout';
import { config as cssConfig } from '../../../Theme';
import { FEEBACK_INDEX, FeedbackHeader, FeedbackModal } from './FeedbackForm';
import { ThankyouView } from './ThankyouView';
import { useRoomLayoutLeaveScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useContainerQuery } from '../hooks/useContainerQuery';

export const Feedback = () => {
  const { feedback } = useRoomLayoutLeaveScreen();
  const [index, setIndex] = useState(FEEBACK_INDEX.INIT);
  const isMobile = useContainerQuery(cssConfig.media.md);

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
  // TO show thank ypu page
  if (index === FEEBACK_INDEX.THANK_YOU) {
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
        w: isMobile ? '100%' : '528px',
      }}
    >
      {index === FEEBACK_INDEX.INIT ? (
        <Flex
          css={{
            p: isMobile ? '$10' : '$12',
            border: '1px solid $border_default',
            bg: '$surface_dim',
            borderRadius: !isMobile ? '$3' : '$3 $3 0 0',
            gap: '$10',
            containerMd: {
              position: 'absolute',
              bottom: '0',
              w: '100%',
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
