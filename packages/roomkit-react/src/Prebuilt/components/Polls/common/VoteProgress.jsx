import React from 'react';
import { Progress } from '../../../../';

export const VoteProgress = ({ option, totalResponses }) => {
  const showProgress = typeof option.voteCount === 'number' && typeof totalResponses === 'number' && totalResponses > 0;
  const progressValue = (100 * option.voteCount) / totalResponses;

  return showProgress ? (
    <Progress.Root value={progressValue} css={{ mt: '$4' }}>
      <Progress.Content
        style={{
          transform: `translateX(-${100 - progressValue}%)`,
        }}
      />
    </Progress.Root>
  ) : null;
};
