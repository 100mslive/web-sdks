import React from 'react';
import { AlertTriangleIcon, CrossIcon } from '@100mslive/react-icons';
import { Button } from '../../../Button';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';

export const EndSessionContent = ({
  setShowEndStreamAlert,
  leaveRoom,
  isModal = false,
  isStreamingOn = false,
}: {
  setShowEndStreamAlert: (value: boolean) => void;
  leaveRoom: (options?: { endStream?: boolean }) => Promise<void>;
  isModal?: boolean;
  isStreamingOn: boolean;
}) => {
  return (
    <Box>
      <Flex
        css={{
          color: 'alert.error.default',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <AlertTriangleIcon style={{ marginRight: '0.5rem' }} />
        <Text variant="lg" css={{ color: 'inherit', fontWeight: 'semiBold' }}>
          End {isStreamingOn ? 'Stream' : 'Session'}
        </Text>
        {isModal ? null : (
          <Box css={{ color: 'onSurface.high', ml: 'auto' }} onClick={() => setShowEndStreamAlert(false)}>
            <CrossIcon />
          </Box>
        )}
      </Flex>
      <Text variant="sm" css={{ color: 'onSurface.medium', mb: '8', mt: '4' }}>
        The {isStreamingOn ? 'stream' : 'session'} will end for everyone. You can't undo this action.
      </Text>
      <Flex align="center" justify="between" css={{ w: '100%', gap: '8' }}>
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
            await leaveRoom({ endStream: true });
            setShowEndStreamAlert(false);
          }}
          id="stopStream"
          data-testid="stop_stream_btn"
        >
          End {isStreamingOn ? 'Stream' : 'Session'}
        </Button>
      </Flex>
    </Box>
  );
};
