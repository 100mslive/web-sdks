import React from 'react';
import { Dialog, Text } from '@100mslive/roomkit-react';
import { DialogContent } from './DialogContent';

const ErrorModal = ({ title, body }) => {
  return (
    <Dialog.Root defaultOpen>
      <DialogContent
        title={title || 'Error'}
        closeable={false}
        onInteractOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
        onPointerDownOutside={e => e.preventDefault()}
      >
        <Text css={{ p: '$8 0', wordBreak: 'break-word' }}>{body}</Text>
      </DialogContent>
    </Dialog.Root>
  );
};

export default ErrorModal;
