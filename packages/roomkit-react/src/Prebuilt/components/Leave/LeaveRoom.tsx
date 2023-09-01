import React from 'react';
import { useParams } from 'react-router-dom';
import { useMedia } from 'react-use';
import { ConferencingScreen } from '@100mslive/types-prebuilt';
import { selectIsConnectedToRoom, selectPermissions, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { config as cssConfig } from '../../../Theme';
// @ts-ignore: No implicit Any
import { useHMSPrebuiltContext } from '../../AppContext';
// @ts-ignore: No implicit Any
import { PictureInPicture } from '../PIP/PIPManager';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
import { DesktopLeaveRoom } from './DesktopLeaveRoom';
import { MwebLeaveRoom } from './MwebLeaveRoom';
// @ts-ignore: No implicit Any
import { useNavigation } from '../hooks/useNavigation';

export const LeaveRoom = ({ screenType }: { screenType: keyof ConferencingScreen }) => {
  const navigate = useNavigation();
  const params = useParams();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const permissions = useHMSStore(selectPermissions);
  const isMobile = useMedia(cssConfig.media.md);
  const hmsActions = useHMSActions();
  const { onLeave } = useHMSPrebuiltContext();

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

  const redirectToLeavePage = () => {
    if (params.role) {
      navigate('/leave/' + params.roomId + '/' + params.role);
    } else {
      navigate('/leave/' + params.roomId);
    }
    PictureInPicture.stop().catch(() => console.error('stopping pip'));
    ToastManager.clearAllToast();
    onLeave?.();
  };

  const leaveRoom = () => {
    hmsActions.leave();
    redirectToLeavePage();
  };

  // const endRoom = () => {
  //   hmsActions.endRoom(false, 'End Room');
  //   redirectToLeavePage();
  // };

  if (!permissions || !isConnected) {
    return null;
  }
  return isMobile ? (
    <MwebLeaveRoom leaveRoom={leaveRoom} stopStream={stopStream} screenType={screenType} />
  ) : (
    <DesktopLeaveRoom leaveRoom={leaveRoom} stopStream={stopStream} screenType={screenType} />
  );
};
