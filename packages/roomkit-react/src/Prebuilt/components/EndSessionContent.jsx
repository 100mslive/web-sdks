import React from 'react';
import { AlertTriangleIcon, CrossIcon } from '@100mslive/react-icons';
import { Button } from '../../Button';
import { Box, Flex } from '../../Layout';
import { Text } from '../../Text';
import { useShowStreamingUI } from '../common/hooks';

export const EndSessionContent = ({ setShowEndStreamAlert, stopStream, leaveRoom, isModal = false }) => {
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
          <Box css={{ color: '$on_surface_high', ml: 'auto' }} onClick={() => setShowEndStreamAlert(false)}>
            <CrossIcon />
          </Box>
        )}
      </Flex>
      <Text variant="sm" css={{ color: '$on_surface_medium', mb: '$8', mt: '$4' }}>
        The {showStreamingUI ? 'stream' : 'session'} will end for everyone. You can't undo this action.
      </Text>
      <Flex align="center" justify="between" css={{ w: '100%', gap: '$8' }}>
        <Button
          outlined
          variant="standard"
          css={{ w: '100%', '@md': { display: 'none' } }}
          onClick={() => setShowEndStreamAlert(false)}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          css={{ w: '100%' }}
          onClick={async () => {
            await stopStream();
            leaveRoom();
            setShowEndStreamAlert(false);
          }}
          id="stopStream"
          data-testid="stop_stream_btn"
        >
          End {showStreamingUI ? 'Stream' : 'Session'}
        </Button>
      </Flex>
    </Box>
  );
};
