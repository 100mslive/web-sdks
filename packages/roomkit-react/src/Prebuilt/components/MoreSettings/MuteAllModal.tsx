import React, { useCallback, useState } from 'react';
import {
  HMSRoleName,
  HMSTrackSource,
  HMSTrackType,
  selectAvailableRoleNames,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { MicOffIcon } from '@100mslive/react-icons';
import { Dialog } from '../../..';
import { Sheet } from '../../../Sheet';
// @ts-ignore: No implicit any
import { DialogContent } from '../../primitives/DialogContent';
import { MuteAllContent } from './MuteAllContent';

export const MuteAllModal = ({
  onOpenChange,
  isMobile = false,
}: {
  onOpenChange: (value: boolean) => void;
  isMobile?: boolean;
}) => {
  const roles = useHMSStore(selectAvailableRoleNames);
  const hmsActions = useHMSActions();
  const [enabled, setEnabled] = useState(false);
  const [trackType, setTrackType] = useState<HMSTrackType>();
  const [selectedRole, setRole] = useState<HMSRoleName>();
  const [selectedSource, setSource] = useState<HMSTrackSource>();

  const muteAll = useCallback(async () => {
    await hmsActions.setRemoteTracksEnabled({
      enabled: enabled,
      type: trackType,
      source: selectedSource,
      roles: selectedRole ? [selectedRole] : undefined,
    });
    onOpenChange(false);
  }, [selectedRole, enabled, trackType, selectedSource, hmsActions, onOpenChange]);

  const props = {
    muteAll,
    roles,
    enabled,
    setEnabled,
    trackType,
    setTrackType,
    selectedRole,
    setRole,
    selectedSource,
    setSource,
    isMobile,
  };

  if (isMobile) {
    return (
      <Sheet.Root defaultOpen onOpenChange={onOpenChange}>
        <Sheet.Content style={{ px: '$10' }}>
          <MuteAllContent {...props} />
        </Sheet.Content>
      </Sheet.Root>
    );
  }

  return (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <DialogContent title="Mute/Unmute Remote Tracks" Icon={MicOffIcon}>
        <MuteAllContent {...props} />
      </DialogContent>
    </Dialog.Root>
  );
};
