import React, { useCallback, useState } from 'react';
import { useHMSActions } from '@100mslive/react-sdk';
import { MicOffIcon } from '@100mslive/react-icons';
import { Dialog } from '../../../';
import { DialogContent } from '../../primitives/DialogContent';
import { useFilteredRoles } from '../../common/hooks';
import { MuteAllContent } from './MuteAllContent';
import { Sheet } from '../../../Sheet';

const trackSourceOptions = [
  { label: 'All Track Sources', value: '' },
  { label: 'regular', value: 'regular' },
  { label: 'screen', value: 'screen' },
  { label: 'audioplaylist', value: 'audioplaylist' },
  { label: 'videoplaylist', value: 'videoplaylist' },
];
const trackTypeOptions = [
  { label: 'All Track Types', value: '' },
  { label: 'audio', value: 'audio' },
  { label: 'video', value: 'video' },
];
export const MuteAllModal = ({ onOpenChange, isMobile = false }) => {
  const roles = useFilteredRoles();
  const hmsActions = useHMSActions();
  const [enabled, setEnabled] = useState(false);
  const [trackType, setTrackType] = useState();
  const [selectedRole, setRole] = useState();
  const [selectedSource, setSource] = useState();

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
    trackSourceOptions,
    trackTypeOptions,
    isMobile
  };

  if (isMobile) {
    return (
      <Sheet.Root defaultOpen onOpenChange={onOpenChange}>
        <Sheet.Content css={{ px: '$10' }}>
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
