import React, { useState } from 'react';
import { selectLocalPeerName, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { config as cssConfig, Dialog } from '../../..';
import { Sheet } from '../../../Sheet';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
// @ts-ignore: No implicit Any
import { ChangeNameContent } from './ChangeNameContent';
import { useMedia } from '../../common/useMediaOverride';
// @ts-ignore: No implicit Any
import { UserPreferencesKeys, useUserPreferences } from '../hooks/useUserPreferences';

export const ChangeNameModal = ({
  onOpenChange,
  openParentSheet = undefined,
}: {
  onOpenChange: (value: boolean) => void;
  openParentSheet?: () => void;
}) => {
  const [previewPreference, setPreviewPreference] = useUserPreferences(UserPreferencesKeys.PREVIEW);
  const hmsActions = useHMSActions();
  const localPeerName = useHMSStore(selectLocalPeerName);
  const [currentName, setCurrentName] = useState(localPeerName);
  const isMobile = useMedia(cssConfig.media.md);

  const changeName = async () => {
    const name = currentName?.trim() || '';
    if (!name || name === localPeerName) {
      return;
    }
    try {
      await hmsActions.changeName(name);
      setPreviewPreference({
        ...(previewPreference || {}),
        name,
      });
    } catch (error) {
      console.error('failed to update name', error);
      ToastManager.addToast({ title: (error as Error).message });
    } finally {
      onOpenChange(false);
    }
  };

  const props = {
    changeName,
    setCurrentName,
    currentName,
    localPeerName,
    isMobile,
    onExit: () => onOpenChange(false),
    onBackClick: () => {
      onOpenChange(false);
      openParentSheet?.();
    },
  };

  if (isMobile) {
    return (
      <Sheet.Root defaultOpen onOpenChange={onOpenChange}>
        <Sheet.Content css={{ bg: '$surface_dim', p: '$8 0' }} onOpenAutoFocus={e => e.preventDefault()}>
          <ChangeNameContent {...props} />
        </Sheet.Content>
      </Sheet.Root>
    );
  }

  return (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content css={{ bg: '$surface_dim', width: 'min(400px,80%)', p: '$10' }}>
          <ChangeNameContent {...props} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
