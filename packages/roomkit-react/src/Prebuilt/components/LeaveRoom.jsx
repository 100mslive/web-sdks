import React from 'react';
import { useParams } from 'react-router-dom';
import { useMedia } from 'react-use';
import { selectIsConnectedToRoom, selectPermissions, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { DesktopLeaveRoom } from './MoreSettings/SplitComponents/DesktopLeaveRoom';
import { MwebLeaveRoom } from './MoreSettings/SplitComponents/MwebLeaveRoom';
import { PictureInPicture } from './PIP/PIPManager';
import { ToastManager } from './Toast/ToastManager';
import { IconButton } from '../../IconButton';
import { config as cssConfig, styled } from '../../Theme';
import { useHMSPrebuiltContext } from '../AppContext';
import { useNavigation } from './hooks/useNavigation';

export const LeaveRoom = () => {
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
    <MwebLeaveRoom leaveIconButton={LeaveIconButton} leaveRoom={leaveRoom} stopStream={stopStream} />
  ) : (
    <DesktopLeaveRoom
      leaveIconButton={LeaveIconButton}
      menuTriggerButton={MenuTriggerButton}
      leaveRoom={leaveRoom}
      stopStream={stopStream}
    />
  );
};

const LeaveIconButton = styled(IconButton, {
  color: '$on_primary_high',
  h: '$14',
  px: '$4',
  r: '$1',
  bg: '$alert_error_default',
  '&:not([disabled]):hover': {
    bg: '$alert_error_bright',
  },
  '&:not([disabled]):active': {
    bg: '$alert_error_default',
  },
  '@md': {
    mx: 0,
  },
});

const MenuTriggerButton = styled(LeaveIconButton, {
  borderLeft: '1px solid $alert_error_dim',
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
  px: '$2',
});
