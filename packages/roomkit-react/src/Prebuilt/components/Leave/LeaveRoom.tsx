import React from 'react';
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
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
import { DesktopLeaveRoom } from './DesktopLeaveRoom';
import { MwebLeaveRoom } from './MwebLeaveRoom';
import { useLandscapeHLSStream, useMobileHLSStream } from '../../common/hooks';

export const LeaveRoom = ({ screenType }: { screenType: keyof ConferencingScreen }) => {
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
  const isMobileHLSStream = useMobileHLSStream();
  const isLandscapeHLSStream = useLandscapeHLSStream();

  const stopStream = async () => {
    try {
      if (permissions?.hlsStreaming) {
        console.log('Stopping HLS stream');
        await hmsActions.stopHLSStreaming();
        ToastManager.addToast({ title: 'Stopping the stream' });
      }
    } catch (e) {
      console.error('Error stopping stream', e);
      ToastManager.addToast({ title: 'Error in stopping the stream', type: 'error' });
    }
  };

  const endRoom = async () => {
    await hmsActions.endRoom(false, 'End Room');
  };

  const leaveRoom = async (options: { endStream?: boolean } = { endStream: false }) => {
    if (options.endStream || (hlsState.running && peersWithStreamingRights.length === 1)) {
      await stopStream();
    }
    await hmsActions.leave();
  };

  if (!permissions || !isConnected) {
    return null;
  }
  if (isMobileHLSStream || isLandscapeHLSStream) {
    return <MwebLeaveRoom leaveRoom={leaveRoom} endRoom={endRoom} />;
  }
  return isMobile ? (
    <MwebLeaveRoom leaveRoom={leaveRoom} endRoom={endRoom} />
  ) : (
    <DesktopLeaveRoom leaveRoom={leaveRoom} screenType={screenType} endRoom={endRoom} />
  );
};
