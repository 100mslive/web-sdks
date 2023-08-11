import React from 'react';
import { AlertTriangleIcon, CrossIcon } from '@100mslive/react-icons';
import { Button } from '../../Button';
import { Box, Flex } from '../../Layout';
import { Text } from '../../Text';
import { useShowStreamingUI } from '../common/hooks';

export const EndSessionContent = ({ setShowEndRoomAlert, endRoom, isModal = false }) => {
  const showStreamingUI = useShowStreamingUI();
  return (
    <Box>
      <Flex
        css={{
          color: '$alert_error_default',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <AlertTriangleIcon style={{ marginRight: '0.5rem' }} />
        <Text variant="lg" css={{ color: 'inherit', fontWeight: '$semiBold' }}>
          End {showStreamingUI ? 'Stream' : 'Session'}
        </Text>
        {isModal ? null : (
          <Box css={{ color: '$on_surface_high', ml: 'auto' }} onClick={() => setShowEndRoomAlert(false)}>
            <CrossIcon />
          </Box>
        )}
      </Flex>
      <Text variant="sm" css={{ color: '$on_surface_medium', mb: '$8', mt: '$4' }}>
        The {showStreamingUI ? 'stream' : 'session'} will end for everyone and all the activities will stop. You can't
        undo this action.
      </Text>
      <Flex align="center" justify="between" css={{ w: '100%', gap: '$8' }}>
        <Button
          outlined
          variant="standard"
          css={{ w: '100%', '@md': { display: 'none' } }}
          onClick={() => setShowEndRoomAlert(false)}
        >
          Cancel
        </Button>
        <Button variant="danger" css={{ w: '100%' }} onClick={endRoom} id="lockRoom" data-testid="lock_end_room">
          End {showStreamingUI ? 'Stream' : 'Session'}
        </Button>
      </Flex>
    </Box>
  );
};
