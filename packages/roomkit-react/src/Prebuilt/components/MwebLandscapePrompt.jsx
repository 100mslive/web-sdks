import React, { useEffect, useState } from 'react';
import { useMedia } from 'react-use';
import { RefreshIcon } from '@100mslive/react-icons';
import { Button } from '../../Button';
import { Box, Flex } from '../../Layout';
import { Dialog } from '../../Modal';
import { Text } from '../../Text';
import { config as cssConfig } from '../../Theme';
import { isAndroid, isIOS } from '../common/constants';

export const MwebLandscapePrompt = () => {
  const isMobile = isAndroid || isIOS;
  const isLandscape = useMedia(cssConfig.media.ls);
  const [showMwebLandscapePrompt, setShowMwebLandscapePrompt] = useState(isMobile && isLandscape);

  useEffect(() => {
    const handleResize = () => {
      setShowMwebLandscapePrompt(isMobile && window.innerWidth < window.innerHeight);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Dialog.Root open={showMwebLandscapePrompt} onOpenChange={setShowMwebLandscapePrompt}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content css={{ w: 'min(420px, 90%)', p: '$8', bg: '$surface_dim' }}>
          <Box>
            <Flex
              css={{
                color: '$primary_default',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <RefreshIcon style={{ marginRight: '0.5rem' }} />
              <Text variant="lg" css={{ color: '$on_surface_high', fontWeight: '$semiBold' }}>
                Please rotate your device
              </Text>
            </Flex>
            <Text variant="sm" css={{ color: '$on_surface_medium', mb: '$8', mt: '$4' }}>
              We do not support landscape mode as of now, please use the app in portrait mode for the best experience.
            </Text>
            <Flex align="center" justify="between" css={{ w: '100%', gap: '$8' }}>
              <Button outlined variant="standard" css={{ w: '100%' }} onClick={() => setShowMwebLandscapePrompt(false)}>
                Continue anyway
              </Button>
            </Flex>
          </Box>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
