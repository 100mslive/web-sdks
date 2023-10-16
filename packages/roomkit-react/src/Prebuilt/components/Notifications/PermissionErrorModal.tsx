import React, { useEffect, useState } from 'react';
import { useMedia } from 'react-use';
import { HMSNotificationTypes, useHMSNotifications } from '@100mslive/react-sdk';
import { Button, config as cssConfig, Dialog, Flex, Text } from '../../..';
// @ts-ignore: No implicit Any
import androidPermissionAlert from '../../images/android-perm-1.png';
// @ts-ignore: No implicit Any
import iosPermissions from '../../images/ios-perm-0.png';
// @ts-ignore: No implicit Any
import { isAndroid, isIOS } from '../../common/constants';

export function PermissionErrorModal() {
  const notification = useHMSNotifications(HMSNotificationTypes.ERROR);
  const [deviceType, setDeviceType] = useState('');
  const [isSystemError, setIsSystemError] = useState(false);
  const isMobile = useMedia(cssConfig.media.md);

  useEffect(() => {
    if (
      !notification ||
      (notification.data?.code !== 3001 && notification.data?.code !== 3011) ||
      (notification.data?.code === 3001 && notification.data?.message.includes('screen'))
    ) {
      return;
    }
    console.error(`[${notification.type}]`, notification);
    const errorMessage = notification.data?.message;
    const hasAudio = errorMessage.includes('audio');
    const hasVideo = errorMessage.includes('video');
    const hasScreen = errorMessage.includes('screen');
    if (hasAudio && hasVideo) {
      setDeviceType('camera and microphone');
    } else if (hasAudio) {
      setDeviceType('microphone');
    } else if (hasVideo) {
      setDeviceType('camera');
    } else if (hasScreen) {
      setDeviceType('screen');
    }
    setIsSystemError(notification.data.code === 3011);
  }, [notification]);

  return deviceType ? (
    <Dialog.Root open={!!deviceType}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content css={{ w: 'min(380px, 90%)', p: '$8' }}>
          <Dialog.Title
            css={{
              borderBottom: '1px solid $border_default',
            }}
          >
            {isMobile && isIOS ? (
              <img style={{ maxWidth: '100%', maxHeight: '100%' }} src={iosPermissions} alt="iOS Permission flow" />
            ) : null}

            {/* Images for android */}
            {isMobile && isAndroid ? (
              <img
                src={androidPermissionAlert}
                style={{ maxWidth: '100%', maxHeight: '100%' }}
                alt="Android Permission flow "
              />
            ) : null}

            <Text variant="h6">We can't access your {deviceType}</Text>
          </Dialog.Title>

          <Text variant="sm" css={{ pt: '$4', pb: '$10', color: '$on_surface_medium' }}>
            {/* IOS prompt text */}
            {isMobile && isIOS
              ? 'Enable permissions by reloading this page and clicking "Allow" on the pop-up, or change settings from the address bar.'
              : null}

            {/* Prompt for android devices */}
            {isMobile && isAndroid
              ? `To allow other users to see and hear you, click the blocked camera icon in your browser's address bar.`
              : null}

            {/* Prompt for desktops */}
            {!isMobile ? `Access to ${deviceType} is required. ` : null}

            {isSystemError && !isMobile
              ? `Enable permissions for ${deviceType}${deviceType === 'screen' ? 'share' : ''} from sytem settings`
              : null}
            {!isSystemError && !isMobile
              ? `Enable permissions for ${deviceType}${
                  deviceType === 'screen' ? 'share' : ''
                } from address bar or browser settings.`
              : null}
          </Text>

          {/* CTA section */}
          {isMobile && isIOS ? (
            <>
              <Button onClick={() => window.location.reload()} css={{ w: '100%', mb: '$6' }}>
                Reload
              </Button>
              <Button outlined variant="standard" onClick={() => setDeviceType('')} css={{ w: '100%' }}>
                Continue anyway
              </Button>
            </>
          ) : null}

          {isMobile && isAndroid ? (
            <>
              <Button onClick={() => setDeviceType('')} css={{ w: '100%', mb: '$6' }}>
                I've allowed access
              </Button>
              <Button outlined variant="standard" onClick={() => setDeviceType('')} css={{ w: '100%' }}>
                Continue anyway
              </Button>
            </>
          ) : null}

          {!isMobile ? (
            <Flex justify="end" css={{ w: '100%' }}>
              <Button outlined variant="standard" onClick={() => setDeviceType('')}>
                Dismiss
              </Button>
            </Flex>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ) : null;
}
