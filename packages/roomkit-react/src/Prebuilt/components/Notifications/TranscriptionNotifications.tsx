import React, { useEffect, useRef } from 'react';
import { HMSNotificationTypes, HMSTranscriptionState, useHMSNotifications } from '@100mslive/react-sdk';
import { AlertTriangleIcon, ClosedCaptionIcon, GlobeIcon, OpenCaptionIcon } from '@100mslive/react-icons';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
// @ts-ignore: No implicit Any
import { useSetAppDataByKey } from '../AppData/useUISettings';
import { CAPTION_TOAST } from '../../common/constants';

export const TranscriptionNotifications = () => {
  const notification = useHMSNotifications(HMSNotificationTypes.TRANSCRIPTION_STATE_UPDATED);
  const [toastId, setToastId] = useSetAppDataByKey(CAPTION_TOAST.captionToast);
  const prevState = useRef<string | undefined>(undefined);
  const prevTranslationEnabled = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (!notification?.data) {
      return;
    }

    const transcriptionStates = notification.data;
    if (transcriptionStates.length === 0) {
      return;
    }

    const { state, error, translation } = transcriptionStates[0];
    const stateChanged = prevState.current !== state;
    const translationChanged = prevTranslationEnabled.current !== !!translation?.enabled;

    prevState.current = state;
    prevTranslationEnabled.current = !!translation?.enabled;

    let id = '';

    if (error) {
      id = ToastManager.replaceToast(toastId, {
        title: `Failed to enable Closed Caption`,
        variant: 'error',
        icon: <AlertTriangleIcon style={{ marginRight: '0.5rem' }} />,
      });
    } else if (stateChanged && state === HMSTranscriptionState.STARTED) {
      // Captions just started
      id = ToastManager.replaceToast(toastId, {
        title: translation?.enabled
          ? `Closed Captioning enabled with Translation`
          : `Closed Captioning enabled for everyone`,
        variant: 'standard',
        duration: 2000,
        icon: translation?.enabled ? (
          <GlobeIcon style={{ marginRight: '0.5rem' }} />
        ) : (
          <ClosedCaptionIcon style={{ marginRight: '0.5rem' }} />
        ),
      });
    } else if (stateChanged && state === HMSTranscriptionState.STOPPED) {
      id = ToastManager.replaceToast(toastId, {
        title: `Closed Captioning disabled for everyone`,
        variant: 'standard',
        duration: 2000,
        icon: <OpenCaptionIcon style={{ marginRight: '0.5rem' }} />,
      });
    } else if (!stateChanged && translationChanged) {
      // Config-only update — translation toggled mid-call
      id = ToastManager.replaceToast(toastId, {
        title: translation?.enabled ? `Translation enabled for everyone` : `Translation disabled for everyone`,
        variant: 'standard',
        duration: 2000,
        icon: <GlobeIcon style={{ marginRight: '0.5rem' }} />,
      });
    }

    if (id) {
      setToastId(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification, setToastId]);

  return null;
};
