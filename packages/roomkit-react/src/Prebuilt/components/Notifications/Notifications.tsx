/* eslint-disable no-case-declarations */
import React, { useCallback, useEffect } from 'react';
import {
  HMSNotificationTypes,
  HMSRoleChangeRequest,
  HMSRoomState,
  selectIsLocalScreenShared,
  selectRoomState,
  useAwayNotifications,
  useCustomEvent,
  useHMSNotifications,
  useHMSStore,
} from '@100mslive/react-sdk';
import { useRoomLayout } from '../../provider/roomLayoutProvider';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
import { ChatNotifications } from './ChatNotifications';
import { ErrorNotificationModal } from './ErrorNotificationModal';
import { HandRaisedNotifications } from './HandRaisedNotifications';
import { PeerNotifications } from './PeerNotifications';
import { PollNotificationModal } from './PollNotificationModal';
import { ReconnectNotifications } from './ReconnectNotifications';
import { TrackBulkUnmuteModal } from './TrackBulkUnmuteModal';
import { TrackNotifications } from './TrackNotifications';
import { TrackUnmuteModal } from './TrackUnmuteModal';
import { TranscriptionNotifications } from './TranscriptionNotifications';
// @ts-ignore: No implicit Any
import { useIsNotificationDisabled, useSubscribedNotifications } from '../AppData/useUISettings';
import { usePIPWindow } from '../PIP/usePIPWindow';
import { ROLE_CHANGE_DECLINED } from '../../common/constants';

const notificationTypes = [
  HMSNotificationTypes.CHANGE_TRACK_STATE_REQUEST,
  HMSNotificationTypes.DEVICE_CHANGE_UPDATE,
  HMSNotificationTypes.NEW_MESSAGE,
];

export function Notifications() {
  const notification = useHMSNotifications(notificationTypes);
  const subscribedNotifications = useSubscribedNotifications() || {};
  const roomState = useHMSStore(selectRoomState);
  const isNotificationDisabled = useIsNotificationDisabled();
  const { showNotification } = useAwayNotifications();
  const amIScreenSharing = useHMSStore(selectIsLocalScreenShared);
  const logoURL = useRoomLayout()?.logo?.url;
  const { pipWindow } = usePIPWindow();

  const handleRoleChangeDenied = useCallback((request: HMSRoleChangeRequest & { peerName: string }) => {
    ToastManager.addToast({
      title: `${request.peerName} denied your request to join the ${request.role.name} role`,
      variant: 'error',
    });
  }, []);

  useCustomEvent({ type: ROLE_CHANGE_DECLINED, onEvent: handleRoleChangeDenied });

  useEffect(() => {
    if (!notification || isNotificationDisabled) {
      return;
    }
    switch (notification.type) {
      case HMSNotificationTypes.CHANGE_TRACK_STATE_REQUEST:
        const track = notification.data?.track;
        if (!notification.data.enabled) {
          ToastManager.addToast({
            title: `Your ${track.source} ${track.type} was muted by
                ${notification.data.requestedBy?.name}.`,
          });
        }
        break;
      case HMSNotificationTypes.DEVICE_CHANGE_UPDATE:
        ToastManager.addToast({
          title: notification.message,
        });
        break;
      case HMSNotificationTypes.NEW_MESSAGE:
        if (amIScreenSharing && !notification.data?.ignored && !pipWindow) {
          showNotification(`New message from ${notification.data.senderName}`, {
            body: notification.data.message,
            icon: logoURL,
          });
        }
        break;
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification, subscribedNotifications.ERROR, subscribedNotifications.METADATA_UPDATED]);

  if (isNotificationDisabled) {
    return null;
  }

  return (
    <>
      <TrackUnmuteModal />
      <TrackBulkUnmuteModal />
      <TrackNotifications />
      {roomState === HMSRoomState.Connected ? <PeerNotifications /> : null}
      <PollNotificationModal />
      <ReconnectNotifications />
      <ErrorNotificationModal />
      <ChatNotifications />
      <HandRaisedNotifications />
      <TranscriptionNotifications />
    </>
  );
}
