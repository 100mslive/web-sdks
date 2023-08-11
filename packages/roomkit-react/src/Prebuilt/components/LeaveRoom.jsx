import React from 'react';
import { useParams } from 'react-router-dom';
import { useMedia } from 'react-use';
import { selectIsConnectedToRoom, selectPermissions, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { DesktopLeaveRoom } from './MoreSettings/SplitComponents/DesktopLeaveRoom';
import { MwebLeaveRoom } from './MoreSettings/SplitComponents/MwebLeaveRoom';
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
  const { showLeave, onLeave } = useHMSPrebuiltContext();

  const redirectToLeavePage = () => {
    if (showLeave) {
      if (params.role) {
        navigate('/leave/' + params.roomId + '/' + params.role);
      } else {
        navigate('/leave/' + params.roomId);
      }
    }
    ToastManager.clearAllToast();
    onLeave?.();
  };

  const leaveRoom = () => {
    hmsActions.leave();
    redirectToLeavePage();
  };

  const endRoom = () => {
    hmsActions.endRoom(false, 'End Room');
    redirectToLeavePage();
  };

  if (!permissions || !isConnected) {
    return null;
  }
  return isMobile ? (
    <MwebLeaveRoom leaveIconButton={LeaveIconButton} leaveRoom={leaveRoom} endRoom={endRoom} />
  ) : (
    <DesktopLeaveRoom
      leaveIconButton={LeaveIconButton}
      menuTriggerButton={MenuTriggerButton}
      leaveRoom={leaveRoom}
      endRoom={endRoom}
    />
  );
};

const LeaveIconButton = styled(IconButton, {
  color: '$on_primary_high',
  h: '$14',
  px: '$8',
  r: '$1',
  bg: '$alert_error_default',
  '&:not([disabled]):hover': {
    bg: '$alert_error_bright',
  },
  '&:not([disabled]):active': {
    bg: '$alert_error_default',
  },
  '@md': {
    px: '$4',
    mx: 0,
  },
});

const MenuTriggerButton = styled(LeaveIconButton, {
  borderLeft: '1px solid $alert_error_dim',
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
  px: '$3',
  '@md': {
    px: '$2',
  },
});
