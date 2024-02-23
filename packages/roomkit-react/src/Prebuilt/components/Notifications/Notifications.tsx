/* eslint-disable no-case-declarations */
import React, { useCallback, useEffect } from 'react';
import {
  HMSNotificationTypes,
  HMSRoleChangeRequest,
  HMSRoomState,
  selectIsLocalScreenShared,
  selectLocalPeerID,
  selectPeerNameByID,
  selectRoomState,
  useAwayNotifications,
  useCustomEvent,
  useHMSNotifications,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { GroupIcon } from '@100mslive/react-icons';
import { Box, Button } from '../../..';
import { useRoomLayout, useUpdateRoomLayout } from '../../provider/roomLayoutProvider';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
import { AutoplayBlockedModal } from './AutoplayBlockedModal';
import { ChatNotifications } from './ChatNotifications';
import { HandRaisedNotifications } from './HandRaisedNotifications';
import { InitErrorModal } from './InitErrorModal';
import { PeerNotifications } from './PeerNotifications';
import { PermissionErrorModal } from './PermissionErrorModal';
import { ReconnectNotifications } from './ReconnectNotifications';
import { TrackBulkUnmuteModal } from './TrackBulkUnmuteModal';
import { TrackNotifications } from './TrackNotifications';
import { TrackUnmuteModal } from './TrackUnmuteModal';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore: No implicit Any
import { usePollViewToggle } from '../AppData/useSidepane';
// @ts-ignore: No implicit Any
import { useIsNotificationDisabled, useSubscribedNotifications } from '../AppData/useUISettings';
import { ROLE_CHANGE_DECLINED } from '../../common/constants';

const pollToastKey: Record<string, string> = {};

export function Notifications() {
  const localPeerID = useHMSStore(selectLocalPeerID);
  const notification = useHMSNotifications();
  const subscribedNotifications = useSubscribedNotifications() || {};
  const roomState = useHMSStore(selectRoomState);
  const updateRoomLayoutForRole = useUpdateRoomLayout();
  const isNotificationDisabled = useIsNotificationDisabled();
  const screenProps = useRoomLayoutConferencingScreen();
  const vanillaStore = useHMSVanillaStore();
  const togglePollView = usePollViewToggle();
  const { showNotification } = useAwayNotifications();
  const amIScreenSharing = useHMSStore(selectIsLocalScreenShared);
  const logoURL = useRoomLayout()?.logo?.url;

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
      case HMSNotificationTypes.NAME_UPDATED:
        console.log(notification.data.id + ' changed their name to ' + notification.data.name);
        break;
      case HMSNotificationTypes.ERROR:
        if (notification.data?.isTerminal && notification.data?.action !== 'INIT') {
          if ([500, 6008].includes(notification.data?.code)) {
            ToastManager.addToast({
              title: `Error: ${notification.data?.message}`,
            });
          } else if (notification.data?.message === 'role limit reached') {
            ToastManager.addToast({
              title: 'The room is currently full, try joining later',
              close: true,
              icon: (
                <Box css={{ color: '$alert_error_default' }}>
                  <GroupIcon />
                </Box>
              ),
            });
          } else {
            ToastManager.addToast({
              title:
                notification.data?.message ||
                'We couldn’t reconnect you. When you’re back online, try joining the room.',
              close: false,
            });
          }
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
      case HMSNotificationTypes.ROLE_UPDATED: {
        if (notification.data?.isLocal && notification.data?.roleName) {
          ToastManager.addToast({
            title: `You are now a ${notification.data.roleName}`,
          });
          updateRoomLayoutForRole?.(notification.data.roleName);
        }
        break;
      }
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
        break;
      case HMSNotificationTypes.DEVICE_CHANGE_UPDATE:
        ToastManager.addToast({
          title: notification.message,
        });
        break;

      case HMSNotificationTypes.POLL_STARTED:
        if (notification.data.startedBy !== localPeerID && screenProps.screenType !== 'hls_live_streaming') {
          const pollStartedBy = vanillaStore.getState(selectPeerNameByID(notification.data.startedBy)) || 'Participant';

          const pollToastID = ToastManager.addToast({
            title: `${pollStartedBy} started a ${notification.data.type}: ${notification.data.title}`,
            action: (
              <Button
                onClick={() => togglePollView(notification.data.id)}
                variant="standard"
                css={{
                  backgroundColor: '$surface_bright',
                  fontWeight: '$semiBold',
                  color: '$on_surface_high',
                  p: '$xs $md',
                }}
              >
                {notification.data.type === 'quiz' ? 'Answer' : 'Vote'}
              </Button>
            ),
            duration: Infinity,
          });
          pollToastKey[notification.data.id] = pollToastID;
        }
        break;
      case HMSNotificationTypes.POLL_STOPPED:
        const pollID = notification?.data.id;
        if (pollID && pollToastKey?.[pollID]) {
          ToastManager.removeToast(pollToastKey?.[notification.data.id]);
          delete pollToastKey[notification?.data.id];
        }
        break;
      case HMSNotificationTypes.NEW_MESSAGE:
        if (amIScreenSharing) {
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
      <ReconnectNotifications />
      <AutoplayBlockedModal />
      <PermissionErrorModal />
      <InitErrorModal />
      <ChatNotifications />
      <HandRaisedNotifications />
    </>
  );
}
