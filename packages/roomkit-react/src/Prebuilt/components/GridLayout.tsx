import React from 'react';
import { selectPeerScreenSharing, useHMSStore } from '@100mslive/react-sdk';
// @ts-ignore
import { EqualProminence } from './EqualProminence';
import { RoleProminence } from './RoleProminence';
import { ScreenshareLayout } from './ScreenshareLayout';
import { useIsRoleProminenceLayout } from '../provider/roomLayoutProvider/hooks/useIsRoleProminenceLayout';

export const GridLayout = () => {
  const peerSharing = useHMSStore(selectPeerScreenSharing);
  const isRoleProminence = useIsRoleProminenceLayout();

  if (peerSharing) {
    return <ScreenshareLayout />;
  } else if (isRoleProminence) {
    return <RoleProminence />;
  }
  return <EqualProminence />;
};
