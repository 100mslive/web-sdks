import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMedia } from 'react-use';
import { ConferencingScreen } from '@100mslive/types-prebuilt';
import {
  HMSPeer,
  HMSRole,
  selectHLSState,
  selectIsConnectedToRoom,
  selectPeersByCondition,
  selectPermissions,
  selectRolesMap,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { config as cssConfig } from '../../../Theme';
// @ts-ignore: No implicit Any
import { useHMSPrebuiltContext } from '../../AppContext';
// @ts-ignore: No implicit Any
import { PictureInPicture } from '../PIP/PIPManager';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
import { DesktopLeaveRoom } from './DesktopLeaveRoom';
import { MwebLeaveRoom } from './MwebLeaveRoom';
import { useRoomLayoutLeaveScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';

export const LeaveRoom = ({ screenType }: { screenType: keyof ConferencingScreen }) => {
  const navigate = useNavigate();
  const params = useParams();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const permissions = useHMSStore(selectPermissions);
  const isMobile = useMedia(cssConfig.media.md);
  const rolesMap: Record<string, HMSRole> = useHMSStore(selectRolesMap);
  const streamingPermissionRoles = Object.keys(rolesMap).filter(roleName => {
    const roleObj = rolesMap[roleName];
    return roleObj.permissions.hlsStreaming;
  });
  const peersWithStreamingRights = useHMSStore(
    selectPeersByCondition((peer: HMSPeer) => streamingPermissionRoles.includes(peer.roleName || '')),
  );
  const hlsState = useHMSStore(selectHLSState);
  const hmsActions = useHMSActions();
  const { onLeave } = useHMSPrebuiltContext();
  const { isLeaveScreenEnabled } = useRoomLayoutLeaveScreen();

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
    const prefix = isLeaveScreenEnabled ? '/leave/' : '/';
    if (params.role) {
      navigate(prefix + params.roomId + '/' + params.role);
    } else {
      navigate(prefix + params.roomId);
    }
    PictureInPicture.stop().catch(() => console.error('stopping pip'));
    ToastManager.clearAllToast();
    onLeave?.();
  };

  const leaveRoom = async ({ endstream = false }) => {
    if (endstream || (hlsState.running && peersWithStreamingRights.length <= 1)) {
      await stopStream();
    }
    hmsActions.leave();
    redirectToLeavePage();
  };

  if (!permissions || !isConnected) {
    return null;
  }
  return isMobile ? (
    <MwebLeaveRoom leaveRoom={leaveRoom} screenType={screenType} />
  ) : (
    <DesktopLeaveRoom leaveRoom={leaveRoom} screenType={screenType} />
  );
};
