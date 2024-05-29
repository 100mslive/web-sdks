import React, { useRef } from 'react';
import { v4 as uuid } from 'uuid';
// @ts-ignore
import { ToastManager } from '../Toast/ToastManager';

const NOTIFICATION_TIME_DIFFERENCE = 5000;

export const TranscriptionNotifications = ({
  title,
  variant = 'standard',
  duration = 4000,
  updatedAt = Date.now(),
  icon,
}: {
  title: string;
  variant?: string;
  duration?: number;
  updatedAt?: number;
  icon?: React.ReactNode;
}) => {
  const ref = useRef(null);
  console.log('called');

  const showToast = Date.now() - updatedAt < NOTIFICATION_TIME_DIFFERENCE;

  if (!showToast) {
    return;
  }
  const notification = {
    id: uuid(),
    icon,
    title,
    variant,
    duration,
  };
  if (ref.current) {
    ToastManager.removeToast(ref.current);
  }
  const id = ToastManager.addToast(notification);
  console.log('here ', id);
  ref.current = id;
  return <></>;
};
