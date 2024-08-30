import React from 'react';
import { useMedia } from 'react-use';
import { UserMusicIcon } from '@100mslive/react-icons';
import { Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { config as cssConfig } from '../../../Theme';

export const ThankyouView = () => {
  const isMobile = useMedia(cssConfig.media.md);
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
        '@md': {
          position: 'absolute',
          bottom: '0',
        },
      }}
    >
      <UserMusicIcon width="64px" height="64px" />
      <Flex direction="column" align={isMobile ? 'center' : 'start'}>
        <Text variant="h5">Thank you for your feedback!</Text>
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
