import React, { useState } from 'react';
import { Flex } from '../../../Layout';
import { FeedbackHeader, FeedbackModal } from './FeedbackForm';

export const Feedback = () => {
  // TODO - use roomLayoutLeaveScreen
  const ratings = [
    {
      label: 'Great',
      value: 5,
      emoji: '😍',
      question: 'How likely are you to recommend 100ms to a friend or colleague? ',
      reasons: ['Video Quality', 'Audio Quality', 'Ease of Use', 'Features'],
    },
    {
      label: 'Good',
      value: 4,
      emoji: '😊',
      question: 'What can we do to improve your experience?',
      reasons: ['Video Quality', 'Audio Quality', 'Ease of Use', 'Features', 'Latency'],
    },
    {
      label: 'Fair',
      value: 3,
      emoji: '😐',
      question: 'What can we do to improve your experience?',
      reasons: ['Video Quality', 'Audio Quality', 'Frame drops', 'Choppy audio'],
    },
    {
      label: 'Bad',
      value: 2,
      emoji: '😞',
      question: 'What went wrong?',
      reasons: ['Stuck Video', 'Robotic Audio'],
    },
    {
      label: 'Awful',
      value: 1,
      emoji: '😡',
      question: 'What went wrong?',
      reasons: ['Video Quality', 'Audio Quality'],
    },
  ];
  const [index, setIndex] = useState(-1);
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
