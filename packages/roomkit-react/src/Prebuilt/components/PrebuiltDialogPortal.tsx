import React, { ReactNode } from 'react';
import { Dialog } from '../../Modal';

export const PrebuiltDialogPortal = ({ children }: { children: ReactNode }) => (
  <Dialog.Portal container={document.getElementById('prebuilt-container')}>{children}</Dialog.Portal>
);
