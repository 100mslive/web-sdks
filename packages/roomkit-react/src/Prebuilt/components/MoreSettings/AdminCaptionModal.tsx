import React from 'react';
import { useMedia } from 'react-use';
import { config as cssConfig, Dialog } from '../../..';
import { Sheet } from '../../../Sheet';
import { AdminCaptionContent } from './AdminCaptionContent';

export const AdminCaptionModal = ({ onOpenChange }: { onOpenChange: (value: boolean) => void }) => {
  const isMobile = useMedia(cssConfig.media.md);

  const props = {
    isMobile,
    onExit: () => {
      onOpenChange(false);
    },
  };

  if (isMobile) {
    return (
      <Sheet.Root defaultOpen onOpenChange={onOpenChange}>
        <Sheet.Content css={{ bg: '$surface_dim', p: '$8 0' }}>
          <AdminCaptionContent {...props} />
        </Sheet.Content>
      </Sheet.Root>
    );
  }

  return (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content css={{ bg: '$surface_dim', width: 'min(400px,80%)', p: '$10' }}>
          <AdminCaptionContent {...props} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
