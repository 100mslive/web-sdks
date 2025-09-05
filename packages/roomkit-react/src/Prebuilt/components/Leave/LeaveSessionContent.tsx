import React from 'react';
import { AlertTriangleIcon, CrossIcon } from '@100mslive/react-icons';
import { Button } from '../../../Button';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';

export const LeaveSessionContent = ({
  setShowLeaveRoomAlert,
  leaveRoom,
  isModal = false,
}: {
  setShowLeaveRoomAlert: (value: boolean) => void;
  leaveRoom: (options?: { endStream?: boolean; sendReason?: boolean }) => Promise<void>;
  isModal?: boolean;
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
          Leave
        </Text>
        {isModal ? null : (
          <Box css={{ color: 'onSurface.high', ml: 'auto' }} onClick={() => setShowLeaveRoomAlert(false)}>
            <CrossIcon />
          </Box>
        )}
      </Flex>
      <Text variant="sm" css={{ color: 'onSurface.low', mb: '8', mt: '4' }}>
        Others will continue after you leave. You can join the session again.
      </Text>
      <Flex align="center" justify="between" css={{ w: '100%', gap: '8' }}>
        <Button
          outlined
          variant="standard"
          css={{ w: '100%', '@md': { display: 'none' } }}
          onClick={() => setShowLeaveRoomAlert(false)}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          css={{ w: '100%' }}
          onClick={async () => {
            await leaveRoom({ sendReason: true });
          }}
          id="leaveRoom"
          data-testid="leave_room"
        >
          Leave Session
        </Button>
      </Flex>
    </Box>
  );
};
