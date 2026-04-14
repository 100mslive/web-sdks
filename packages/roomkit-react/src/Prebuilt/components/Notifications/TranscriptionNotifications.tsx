import React, { useEffect, useRef } from 'react';
import {
  HMSNotificationTypes,
  HMSTranscriptionState,
  selectTranslationState,
  useHMSNotifications,
  useHMSStore,
} from '@100mslive/react-sdk';
import { AlertTriangleIcon, ClosedCaptionIcon, GlobeIcon, OpenCaptionIcon } from '@100mslive/react-icons';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
// @ts-ignore: No implicit Any
import { useSetAppDataByKey } from '../AppData/useUISettings';
import { CAPTION_TOAST } from '../../common/constants';

export const TranscriptionNotifications = () => {
  const notification = useHMSNotifications(HMSNotificationTypes.TRANSCRIPTION_STATE_UPDATED);
  const [toastId, setToastId] = useSetAppDataByKey(CAPTION_TOAST.captionToast);
  const translationState = useHMSStore(selectTranslationState);
  const prevTranslationEnabled = useRef<boolean | undefined>(undefined);

  // Translation mid-call toggle toast (only when captions are already running)
  useEffect(() => {
    if (prevTranslationEnabled.current === undefined) {
      prevTranslationEnabled.current = translationState.enabled;
      return;
    }
    if (prevTranslationEnabled.current !== translationState.enabled) {
      prevTranslationEnabled.current = translationState.enabled;
      const id = ToastManager.replaceToast(toastId, {
        title: translationState.enabled ? `Translation enabled for everyone` : `Translation disabled for everyone`,
        variant: 'standard',
        duration: 2000,
        icon: <GlobeIcon style={{ marginRight: '0.5rem' }} />,
      });
      setToastId(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translationState.enabled, setToastId]);

  // Caption state change toast
  useEffect(() => {
    if (!notification?.data) {
      return;
    }

    const transcriptionStates = notification.data;
    if (transcriptionStates.length === 0) {
      return;
    }

    let id = '';
    const { state, error, translation } = transcriptionStates[0];

    if (error) {
      id = ToastManager.replaceToast(toastId, {
        title: `Failed to enable Closed Caption`,
        variant: 'error',
        icon: <AlertTriangleIcon style={{ marginRight: '0.5rem' }} />,
      });
    } else if (state === HMSTranscriptionState.STARTED) {
      const withTranslation = translation?.enabled;
      id = ToastManager.replaceToast(toastId, {
        title: withTranslation
          ? `Closed Captioning enabled with Translation`
          : `Closed Captioning enabled for everyone`,
        variant: 'standard',
        duration: 2000,
        icon: withTranslation ? (
          <GlobeIcon style={{ marginRight: '0.5rem' }} />
        ) : (
          <ClosedCaptionIcon style={{ marginRight: '0.5rem' }} />
        ),
      });
      // Sync translation ref so mid-call toggle doesn't re-fire
      prevTranslationEnabled.current = !!withTranslation;
    } else if (state === HMSTranscriptionState.STOPPED) {
      id = ToastManager.replaceToast(toastId, {
        title: `Closed Captioning disabled for everyone`,
        variant: 'standard',
        duration: 2000,
        icon: <OpenCaptionIcon style={{ marginRight: '0.5rem' }} />,
      });
    }

    if (id) {
      setToastId(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification, setToastId]);

  return null;
};
