/* eslint-disable no-case-declarations */
import { useCallback } from 'react';
import { HMSRoleChangeRequest, HMSRoomState, selectRoomState, useCustomEvent, useHMSStore } from '@100mslive/react-sdk';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
import { AutoplayBlockedModal } from './AutoplayBlockedModal';
import { ChatNotifications } from './ChatNotifications';
import { DeviceChangeNotifications } from './DeviceChangeNotifications';
import { DeviceInUseError } from './DeviceInUseError';
import { ErrorNotifications } from './ErrorNotifications';
import { HandRaisedNotifications } from './HandRaisedNotifications';
import { InitErrorModal } from './InitErrorModal';
import { MessageNotifications } from './MessageNotifications';
import { PeerNotifications } from './PeerNotifications';
import { PermissionErrorNotificationModal } from './PermissionErrorModal';
import { PollNotificationModal } from './PollNotificationModal';
import { ReconnectNotifications } from './ReconnectNotifications';
import { RoleChangeNotification } from './RoleChangeNotification';
import { TrackBulkUnmuteModal } from './TrackBulkUnmuteModal';
import { TrackNotifications } from './TrackNotifications';
import { TrackUnmuteModal } from './TrackUnmuteModal';
import { TranscriptionNotifications } from './TranscriptionNotifications';
// @ts-ignore: No implicit Any
import { useIsNotificationDisabled } from '../AppData/useUISettings';
import { ROLE_CHANGE_DECLINED } from '../../common/constants';

export function Notifications() {
  const roomState = useHMSStore(selectRoomState);
  const isNotificationDisabled = useIsNotificationDisabled();

  const handleRoleChangeDenied = useCallback((request: HMSRoleChangeRequest & { peerName: string }) => {
    ToastManager.addToast({
      title: `${request.peerName} denied your request to join the ${request.role.name} role`,
      variant: 'error',
    });
  }, []);

  useCustomEvent({ type: ROLE_CHANGE_DECLINED, onEvent: handleRoleChangeDenied });

  if (isNotificationDisabled) {
    return null;
  }

  return (
    <>
      <TrackUnmuteModal />
      <TrackBulkUnmuteModal />
      <TrackNotifications />
      {roomState === HMSRoomState.Connected ? <PeerNotifications /> : null}
      <RoleChangeNotification />
      <PollNotificationModal />
      <MessageNotifications />
      <DeviceChangeNotifications />
      <ReconnectNotifications />
      <ErrorNotifications />
      <AutoplayBlockedModal />
      <PermissionErrorNotificationModal />
      <InitErrorModal />
      <ChatNotifications />
      <HandRaisedNotifications />
      <TranscriptionNotifications />
      <DeviceInUseError />
    </>
  );
}
