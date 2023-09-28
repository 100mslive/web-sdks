import React, { ReactNode } from 'react';
import { Dialog } from '../../Modal';
import { CSS, styled } from '../../Theme';

export const PrebuiltDialogPortal = ({ children }: { children: ReactNode }) => (
  <Dialog.Portal container={document.getElementById('prebuilt-container')}>{children}</Dialog.Portal>
);

export const PrebuiltDialogContent = ({ children, css, props }: { children: ReactNode; css: CSS; props: any }) => (
  <Dialog.Content {...props} css={{ ...css, position: 'absolute !important' }}>
    {children}
  </Dialog.Content>
);

export const PrebuiltDialogOverlay = styled(Dialog.Overlay, { position: 'absolute' });
