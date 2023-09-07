/* eslint-disable no-case-declarations */
import React, { useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  HMSNotificationTypes,
  HMSRoomState,
  selectRoomState,
  useCustomEvent,
  useHMSNotifications,
  useHMSStore,
} from '@100mslive/react-sdk';
import { Button } from '../../../';
import { useHMSPrebuiltContext } from '../../AppContext';
import { useUpdateRoomLayout } from '../../provider/roomLayoutProvider';
import { PictureInPicture } from '../PIP/PIPManager';
import { ToastBatcher } from '../Toast/ToastBatcher';
import { ToastManager } from '../Toast/ToastManager';
import { AutoplayBlockedModal } from './AutoplayBlockedModal';
import { InitErrorModal } from './InitErrorModal';
import { PeerNotifications } from './PeerNotifications';
import { PermissionErrorModal } from './PermissionErrorModal';
import { ReconnectNotifications } from './ReconnectNotifications';
import { TrackBulkUnmuteModal } from './TrackBulkUnmuteModal';
import { TrackNotifications } from './TrackNotifications';
import { TrackUnmuteModal } from './TrackUnmuteModal';
import { useRoomLayoutLeaveScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useIsNotificationDisabled, useSubscribedNotifications } from '../AppData/useUISettings';
import { getMetadata } from '../../common/utils';
import { ROLE_CHANGE_DECLINED } from '../../common/constants';

export function Notifications() {
  const notification = useHMSNotifications();
  const navigate = useNavigate();
  const params = useParams();
  const subscribedNotifications = useSubscribedNotifications() || {};
  const roomState = useHMSStore(selectRoomState);
  const updateRoomLayoutForRole = useUpdateRoomLayout();
  const isNotificationDisabled = useIsNotificationDisabled();
  const { isLeaveScreenEnabled } = useRoomLayoutLeaveScreen();
  const { onLeave } = useHMSPrebuiltContext();

  const handleRoleChangeDenied = useCallback(request => {
    ToastManager.addToast({
      title: `${request.peerName} denied your request to join the ${request.role.name} role`,
      variant: 'error',
    });
  }, []);

  useCustomEvent({ type: ROLE_CHANGE_DECLINED, onEvent: handleRoleChangeDenied });

  const redirectToLeavePage = () => {
    setTimeout(() => {
      const prefix = isLeaveScreenEnabled ? '/leave/' : '/';
      if (params.role) {
        navigate(prefix + params.roomId + '/' + params.role);
      } else {
        navigate(prefix + params.roomId);
      }
      PictureInPicture.stop().catch(() => console.error('stopping pip'));
      ToastManager.clearAllToast();
      onLeave?.();
    }, 1000);
  };

  useEffect(() => {
    if (!notification || isNotificationDisabled) {
      return;
    }
    switch (notification.type) {
      case HMSNotificationTypes.METADATA_UPDATED:
        if (roomState !== HMSRoomState.Connected) {
          return;
        }
        // Don't toast message when metadata is updated and raiseHand is false.
        // Don't toast message in case of local peer.
        const metadata = getMetadata(notification.data?.metadata);
        if (!metadata?.isHandRaised || notification.data.isLocal) return;

        console.debug('Metadata updated', notification.data);
        if (!subscribedNotifications.METADATA_UPDATED) return;
        ToastBatcher.showToast({ notification });
        break;
      case HMSNotificationTypes.NAME_UPDATED:
        console.log(notification.data.id + ' changed their name to ' + notification.data.name);
        break;
      case HMSNotificationTypes.ERROR:
        if (notification.data?.isTerminal && notification.data?.action !== 'INIT') {
          if ([500, 6008].includes(notification.data?.code)) {
            ToastManager.addToast({
              title: `Error: ${notification.data?.message}`,
            });
          } else {
            // show button action when the error is terminal
            const toastId = ToastManager.addToast({
              title:
                notification.data?.message ||
                'We couldn’t reconnect you. When you’re back online, try joining the room.',
              inlineAction: true,
              action: (
                <Button
                  onClick={() => {
                    ToastManager.removeToast(toastId);
                    navigate(`/${params.roomId}${params.role ? `/${params.role}` : ''}`);
                  }}
                >
                  Rejoin
                </Button>
              ),
              close: false,
            });
          }
          // goto leave for terminal if any action is not performed within 2secs
          // if network is still unavailable going to preview will throw an error
          redirectToLeavePage();
          return;
        }
        // Autoplay error or user denied screen share (cancelled browser pop-up)
        if (notification.data?.code === 3008 || notification.data?.code === 3001 || notification.data?.code === 3011) {
          return;
        }
        if (notification.data?.action === 'INIT') {
          return;
        }
        if (!subscribedNotifications.ERROR) return;
        ToastManager.addToast({
          title: `Error: ${notification.data?.message} - ${notification.data?.description}`,
        });
        break;
      case HMSNotificationTypes.ROLE_UPDATED:
        if (notification.data?.isLocal) {
          ToastManager.addToast({
            title: `You are now a ${notification.data.roleName}`,
          });
          updateRoomLayoutForRole(notification.data.roleName);
        }
        break;
      case HMSNotificationTypes.CHANGE_TRACK_STATE_REQUEST:
        const track = notification.data?.track;
        if (!notification.data.enabled) {
          ToastManager.addToast({
            title: `Your ${track.source} ${track.type} was muted by
                ${notification.data.requestedBy?.name}.`,
          });
        }
        break;
      case HMSNotificationTypes.REMOVED_FROM_ROOM:
      case HMSNotificationTypes.ROOM_ENDED:
        ToastManager.addToast({
          title: `${notification.message}. 
              ${notification.data.reason && `Reason: ${notification.data.reason}`}`,
        });
        redirectToLeavePage();
        break;
      case HMSNotificationTypes.DEVICE_CHANGE_UPDATE:
        ToastManager.addToast({
          title: notification.message,
        });
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
      <PeerNotifications />
      <ReconnectNotifications />
      <AutoplayBlockedModal />
      <PermissionErrorModal />
      <InitErrorModal notification={notification} />
    </>
  );
}
