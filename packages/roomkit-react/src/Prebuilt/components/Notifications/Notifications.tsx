/* eslint-disable no-case-declarations */
import React, { useCallback, useEffect } from 'react';
import {
  HMSNotificationTypes,
  HMSRoleChangeRequest,
  HMSRoomState,
  selectHasPeerHandRaised,
  selectLocalPeerID,
  selectRoomState,
  useCustomEvent,
  useHMSNotifications,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { Button } from '../../..';
import { useUpdateRoomLayout } from '../../provider/roomLayoutProvider';
// @ts-ignore: No implicit Any
import { ToastBatcher } from '../Toast/ToastBatcher';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
import { AutoplayBlockedModal } from './AutoplayBlockedModal';
import { InitErrorModal } from './InitErrorModal';
import { PeerNotifications } from './PeerNotifications';
import { PermissionErrorModal } from './PermissionErrorModal';
import { ReconnectNotifications } from './ReconnectNotifications';
import { TrackBulkUnmuteModal } from './TrackBulkUnmuteModal';
import { TrackNotifications } from './TrackNotifications';
import { TrackUnmuteModal } from './TrackUnmuteModal';
// @ts-ignore: No implicit Any
import { usePollViewToggle } from '../AppData/useSidepane';
// @ts-ignore: No implicit Any
import { useIsNotificationDisabled, useSubscribedNotifications } from '../AppData/useUISettings';
// @ts-ignore: No implicit Any
import { getMetadata } from '../../common/utils';
// @ts-ignore: No implicit Any
import { ROLE_CHANGE_DECLINED } from '../../common/constants';
export function Notifications() {
  const localPeerID = useHMSStore(selectLocalPeerID);
  const notification = useHMSNotifications();
  const subscribedNotifications = useSubscribedNotifications() || {};
  const roomState = useHMSStore(selectRoomState);
  const updateRoomLayoutForRole = useUpdateRoomLayout();
  const isNotificationDisabled = useIsNotificationDisabled();
  const vanillaStore = useHMSVanillaStore();
  const togglePollView = usePollViewToggle();

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
      case HMSNotificationTypes.HAND_RAISE_CHANGED: {
        if (roomState !== HMSRoomState.Connected || notification.data.isLocal) {
          return;
        }
        const hasPeerHandRaised = vanillaStore.getState(selectHasPeerHandRaised(notification.data.id));
        if (hasPeerHandRaised) {
          ToastBatcher.showToast({ notification, type: 'RAISE_HAND' });
        }
        break;
      }
      case HMSNotificationTypes.METADATA_UPDATED:
        if (roomState !== HMSRoomState.Connected) {
          return;
        }
        // Don't show toast message when metadata is updated and raiseHand is false.
        // Don't show toast message in case of local peer.
        const metadata = getMetadata(notification.data?.metadata);
        if (!metadata?.isHandRaised || notification.data.isLocal) return;

        console.debug('Metadata updated', notification.data);
        if (!subscribedNotifications.METADATA_UPDATED) return;
        ToastBatcher.showToast({ notification, type: 'RAISE_HAND' });
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
            ToastManager.addToast({
              title:
                notification.data?.message ||
                'We couldn’t reconnect you. When you’re back online, try joining the room.',
              close: false,
            });
          }
          // goto leave for terminal if any action is not performed within 1s
          // if network is still unavailable going to preview will throw an error
          // redirectToLeave(1000);
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
        // redirectToLeave(1000);
        break;
      case HMSNotificationTypes.DEVICE_CHANGE_UPDATE:
        ToastManager.addToast({
          title: notification.message,
        });
        break;

      case HMSNotificationTypes.POLL_STARTED:
        if (notification.data.startedBy !== localPeerID) {
          ToastManager.addToast({
            title: `A poll was started: ${notification.data.title}`,
            action: (
              <Button
                onClick={() => togglePollView(notification.data.id)}
                variant="standard"
                css={{
                  backgroundColor: '$surfaceLight',
                  fontWeight: '$semiBold',
                  color: '$textHighEmp',
                  p: '$xs $md',
                }}
              >
                Vote
              </Button>
            ),
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
    </>
  );
}
