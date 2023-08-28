import React from 'react';
import { useHMSActions } from '@100mslive/react-sdk';
import { CrossIcon, ShareScreenIcon } from '@100mslive/react-icons';
import { Button } from '../../Button';
import { Flex } from '../../Layout';
import { Text } from '../../Text';

export const ScreenshareDisplay = () => {
  const hmsActions = useHMSActions();

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      css={{
        position: 'relative',
        overflow: 'hidden',
        w: '37.5rem',
        maxWidth: '80%',
        h: '100%',
        r: '$3',
        m: '0 auto',
        color: '$on_surface_high',
        bg: '$background_default',
        textAlign: 'center',
      }}
    >
      <ShareScreenIcon width={48} height={48} />
      <Text variant="h5" css={{ m: '$8 0', color: '$on_surface_high' }}>
        You are sharing your screen
      </Text>
      <Button
        variant="danger"
        css={{ c: '$alert_error_brighter', fontWeight: '$semiBold' }}
        onClick={async () => {
          await hmsActions.setScreenShareEnabled(false);
        }}
        data-testid="stop_screen_share_btn"
      >
        <CrossIcon width={18} height={18} />
        &nbsp; Stop screen share
      </Button>
    </Flex>
  );
};
