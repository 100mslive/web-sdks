import React from 'react';
import { ExitIcon } from '@100mslive/react-icons';
import { Feedback } from './EndCallFeedback/Feedback';
// @ts-ignore: No implicit Any
import { ToastManager } from './Toast/ToastManager';
import { Button } from '../../Button';
import { Box, Flex } from '../../Layout';
import { Text } from '../../Text';
import { useHMSAppStateContext } from '../AppStateContext';
import { Header } from './Header';
// @ts-ignore: No implicit Any
import { defaultPreviewPreference, UserPreferencesKeys, useUserPreferences } from './hooks/useUserPreferences';
import { textEllipsis } from '../../utils';

export const LeaveScreen = () => {
  const { rejoin } = useHMSAppStateContext();
  const [previewPreference] = useUserPreferences(UserPreferencesKeys.PREVIEW, defaultPreviewPreference);
  return (
    <Flex direction="column" css={{ size: '100%' }}>
      <Box css={{ h: '18', '@md': { h: '17' } }} data-testid="header">
        <Header />
      </Box>
      <Flex
        justify="center"
        direction="column"
        align="center"
        css={{ bg: 'background.dim', flex: '1 1 0', position: 'relative' }}
      >
        <Text variant="h2" css={{ fontWeight: 'semiBold' }}>
          👋
        </Text>
        <Text variant="h4" css={{ color: 'onSurface.high', fontWeight: 'semiBold', mt: '12' }}>
          You left the room
        </Text>
        <Text
          variant="body1"
          css={{
            color: 'onSurface.medium',
            mt: '8',
            fontWeight: 'regular',
            textAlign: 'center',
          }}
        >
          Have a nice day
          {previewPreference.name && (
            <Box as="span" css={{ ...textEllipsis(100) }}>
              , {previewPreference.name}
            </Box>
          )}
          !
        </Text>
        <Flex css={{ mt: '14', gap: '10', alignItems: 'center' }}>
          <Text variant="body1" css={{ color: 'onSurface.medium', fontWeight: 'regular' }}>
            Left by mistake?
          </Text>
          <Button
            onClick={() => {
              rejoin();
              ToastManager.clearAllToast();
            }}
            data-testid="join_again_btn"
          >
            <ExitIcon />
            <Text css={{ ml: '3', fontWeight: 'semiBold', color: 'inherit' }}>Rejoin</Text>
          </Button>
        </Flex>
        <Feedback />
      </Flex>
    </Flex>
  );
};
