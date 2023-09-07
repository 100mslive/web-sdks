import React from 'react';
import { useMedia } from 'react-use';
import { ConferencingScreen } from '@100mslive/types-prebuilt';
import { selectIsConnectedToRoom, selectPermissions, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { config as cssConfig } from '../../../Theme';
// @ts-ignore: No implicit Any
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
import { DesktopLeaveRoom } from './DesktopLeaveRoom';
import { MwebLeaveRoom } from './MwebLeaveRoom';
import { useRedirectToLeave } from '../hooks/useRedirectToLeave';

export const LeaveRoom = ({ screenType }: { screenType: keyof ConferencingScreen }) => {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const permissions = useHMSStore(selectPermissions);
  const isMobile = useMedia(cssConfig.media.md);
  const hmsActions = useHMSActions();
  const { redirectToLeave } = useRedirectToLeave();

  const stopStream = async () => {
    try {
      console.log('Stopping HLS stream');
      await hmsActions.stopHLSStreaming();
      ToastManager.addToast({ title: 'Stopping the stream' });
    } catch (e) {
      console.error('Error stopping stream', e);
      ToastManager.addToast({ title: 'Error in stopping the stream', type: 'error' });
    }
  };

  const leaveRoom = () => {
    hmsActions.leave();
    redirectToLeave();
  };

  if (!permissions || !isConnected) {
    return null;
  }
  return isMobile ? (
    <MwebLeaveRoom leaveRoom={leaveRoom} stopStream={stopStream} screenType={screenType} />
  ) : (
    <DesktopLeaveRoom leaveRoom={leaveRoom} stopStream={stopStream} screenType={screenType} />
  );
};
