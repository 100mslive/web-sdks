import React, { useState } from 'react';
import { CrossIcon, UserMusicIcon } from '@100mslive/react-icons';
import { Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { config as cssConfig } from '../../../Theme';
import { useContainerQuery } from '../hooks/useContainerQuery';

export const ThankyouView = () => {
  const [isVisible, setIsVisible] = useState(true);
  const isMobile = useContainerQuery(cssConfig.media.md);

  if (!isVisible) {
    return null;
  }

  return (
    <Flex
      direction={isMobile ? 'column' : 'row'}
      align="center"
      css={{
        gap: '$10',
        border: '1px solid $border_default',
        borderRadius: !isMobile ? '$3' : '$3 $3 0 0',
        bg: '$surface_dim',
        w: !isMobile ? '528px' : '410px',
        p: '$12',
        pb: isMobile ? '$16' : '$12',
        containerMd: {
          position: 'absolute',
          bottom: '0',
        },
      }}
    >
      {isMobile && (
        <CrossIcon
          width="24px"
          height="24px"
          color="white"
          onClick={() => setIsVisible(false)}
          style={{
            position: 'absolute',
            top: '8px',
            right: '16px',
            cursor: 'pointer',
          }}
        />
      )}
      <UserMusicIcon width="64px" height="64px" />
      <Flex direction="column" align={isMobile ? 'center' : 'start'}>
        <Text variant="h5">Thank you for your feedback</Text>
        <Text
          variant="body1"
          css={{
            fontWeight: '$regular',
            fontSize: '$md',
            opacity: '0.9',
          }}
        >
          Your answers help us improve.
        </Text>
      </Flex>
    </Flex>
  );
};
