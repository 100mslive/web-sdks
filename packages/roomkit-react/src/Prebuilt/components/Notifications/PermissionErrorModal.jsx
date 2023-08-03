import React, { useEffect, useState } from 'react';
import { useMedia } from 'react-use';
import { HMSNotificationTypes, useHMSNotifications } from '@100mslive/react-sdk';
import { Button, config as cssConfig, Dialog, Flex, Text } from '../../../';
import androidPermissions from '../../../assets/android-permission-0.png';
import androidPermissionAlert from '../../../assets/android-permission-alert.png';
import iosPermissions from '../../../assets/ios-permission-0.png';
import { isAndroid, isIOS } from '../../common/constants';

export function PermissionErrorModal() {
  const notification = useHMSNotifications(HMSNotificationTypes.ERROR);
  const [deviceType, setDeviceType] = useState('');
  const [isSystemError, setIsSystemError] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(true);
  const isMobile = useMedia(cssConfig.media.md);

  useEffect(() => {
    if (showAndroidPrompt && isAndroid && isMobile) {
      setDeviceType('camera and microphone');
    }
  }, []);

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
            {isMobile && isIOS ? <img style={{ maxWidth: '100%', maxHeight: '100%' }} src={iosPermissions} /> : null}
            {isMobile && isAndroid ? (
              showAndroidPrompt ? (
                <img src={androidPermissions} style={{ maxWidth: '100%', maxHeight: '100%' }} />
              ) : (
                <img src={androidPermissionAlert} style={{ maxWidth: '100%', maxHeight: '100%' }} />
              )
            ) : null}

            <Text variant="h6">
              {showAndroidPrompt ? `Allow access to your ${deviceType}` : `We can't access your ${deviceType}`}
            </Text>
          </Dialog.Title>
          <Text variant="sm" css={{ pt: '$4', pb: '$10', color: '$on_surface_medium' }}>
            {isMobile && isIOS
              ? 'Enable permissions by reloading this page and clicking “Allow” on the pop-up, or change settings from the address bar.'
              : null}
            {isMobile && isAndroid
              ? showAndroidPrompt
                ? 'In order for others to see and hear you, your browser will request camera and microphone access.'
                : 'To allow other users to see and hear you, click the blocked camera icon in your browser’s address bar.'
              : null}

            {!isMobile
              ? `Access to ${deviceType} is required. ${
                  isSystemError
                    ? `Enable permissions for ${deviceType}${
                        deviceType === 'screen' ? 'share' : ''
                      } from sytem settings`
                    : `Enable permissions for ${deviceType}${
                        deviceType === 'screen' ? 'share' : ''
                      } from address bar or browser settings.`
                }`
              : null}
          </Text>
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
            showAndroidPrompt ? (
              <Button
                css={{ w: '100%' }}
                onClick={() => {
                  setDeviceType('');
                  setShowAndroidPrompt(false);
                }}
              >
                Continue
              </Button>
            ) : (
              <>
                <Button onClick={() => setDeviceType('')} css={{ w: '100%', mb: '$6' }}>
                  I've allowed access
                </Button>
                <Button outlined variant="standard" onClick={() => setDeviceType('')} css={{ w: '100%' }}>
                  Continue anyway
                </Button>
              </>
            )
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
