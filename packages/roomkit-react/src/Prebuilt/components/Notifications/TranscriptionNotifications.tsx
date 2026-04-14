import React, { useEffect } from 'react';
import { match } from 'ts-pattern';
import { HMSNotificationTypes, HMSTranscriptionState, useHMSNotifications } from '@100mslive/react-sdk';
import { AlertTriangleIcon, ClosedCaptionIcon, GlobeIcon, OpenCaptionIcon } from '@100mslive/react-icons';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
// @ts-ignore: No implicit Any
import { useSetAppDataByKey } from '../AppData/useUISettings';
import { CAPTION_TOAST } from '../../common/constants';

export const TranscriptionNotifications = () => {
  const notification = useHMSNotifications([
    HMSNotificationTypes.TRANSCRIPTION_STATE_UPDATED,
    HMSNotificationTypes.TRANSCRIPTION_CONFIG_UPDATED,
  ]);
  const [toastId, setToastId] = useSetAppDataByKey(CAPTION_TOAST.captionToast);

  useEffect(() => {
    if (!notification?.data) {
      return;
    }

    console.debug(`[${notification.type}]`, notification);
    let id = '';

    if (notification.type === HMSNotificationTypes.TRANSCRIPTION_CONFIG_UPDATED) {
      const { translation } = notification.data;
      if (translation) {
        id = ToastManager.replaceToast(toastId, {
          title: translation.enabled ? `Translation enabled for everyone` : `Translation disabled for everyone`,
          variant: 'standard',
          duration: 2000,
          icon: <GlobeIcon style={{ marginRight: '0.5rem' }} />,
        });
      } else {
        id = ToastManager.replaceToast(toastId, {
          title: `Transcription config updated`,
          variant: 'standard',
          duration: 2000,
          icon: <ClosedCaptionIcon style={{ marginRight: '0.5rem' }} />,
        });
      }
      setToastId(id);
      return;
    }

    const transcriptionStates = notification.data;
    if (transcriptionStates.length > 0) {
      match({ state: transcriptionStates[0].state, error: transcriptionStates[0].error })
        .when(
          ({ error }) => !!error,
          () => {
            id = ToastManager.replaceToast(toastId, {
              title: `Failed to enable Closed Caption`,
              variant: 'error',
              icon: <AlertTriangleIcon style={{ marginRight: '0.5rem' }} />,
            });
          },
        )
        .with({ state: HMSTranscriptionState.STARTED }, () => {
          id = ToastManager.replaceToast(toastId, {
            title: `Closed Captioning enabled for everyone`,
            variant: 'standard',
            duration: 2000,
            icon: <ClosedCaptionIcon style={{ marginRight: '0.5rem' }} />,
          });
        })
        .with({ state: HMSTranscriptionState.STOPPED }, () => {
          id = ToastManager.replaceToast(toastId, {
            title: `Closed Captioning disabled for everyone`,
            variant: 'standard',
            duration: 2000,
            icon: <OpenCaptionIcon style={{ marginRight: '0.5rem' }} />,
          });
        })
        .otherwise(() => null);
      setToastId(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification, setToastId]);

  return null;
};
