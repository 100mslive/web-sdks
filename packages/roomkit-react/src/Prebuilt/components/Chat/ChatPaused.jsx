import React from 'react';
import { Button } from '../../../Button';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';

export const ChatPaused = ({ pausedBy, canUnpauseChat, unPauseChat }) => {
  return (
    <Flex
      align="center"
      justify="between"
      css={{ borderRadius: '$1', bg: '$surface_default', p: '$4 $4 $4 $8', w: '100%' }}
    >
      <Box>
        <Text variant="sm" css={{ fontWeight: '$semiBold', color: '$on_surface_high' }}>
          Chat paused
        </Text>
        <Text
          variant="xs"
          css={{ color: '$on_surface_medium', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          Chat has been paused by {pausedBy}
        </Text>
      </Box>
      {canUnpauseChat ? (
        <Button css={{ fontWeight: '$semiBold', fontSize: '$sm', borderRadius: '$2' }} onClick={unPauseChat}>
          Resume
        </Button>
      ) : (
        <></>
      )}
    </Flex>
  );
};
