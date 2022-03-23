import React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { CrossIcon } from '@100mslive/react-icons';
import { IconButton } from '../IconButton';
import { styled } from '../Theme';
import { toastAnimation } from '../utils';

const ToastRoot = styled(ToastPrimitives.Root, {
  r: '$1',
  bg: '$toastBg',
  p: '$8',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  ...toastAnimation,
});
const ToastTitle = styled(ToastPrimitives.Title, {
  fontSize: '$md',
  color: '$textPrimary',
  mr: '$12',
});
const ToastDescription = styled(ToastPrimitives.Description, {
  fontSize: '$sm',
  color: '$textSecondary',
  mr: '$12',
  mt: '$2',
});
const ToastClose = styled(ToastPrimitives.Close, {
  position: 'absolute',
  right: '$4',
  top: '50%',
  transform: 'translateY(-50%)',
});
const ToastAction = styled(ToastPrimitives.Action, {});
const ToastViewport = styled(ToastPrimitives.Viewport, {
  position: 'fixed',
  bottom: 0,
  left: 0,
  display: 'flex',
  flexDirection: 'column',
  padding: '$8',
  gap: 10,
  width: 390,
  maxWidth: '100vw',
  margin: 0,
  listStyle: 'none',
  zIndex: 1000,
});

const DefaultClose = () => {
  return (
    <ToastClose asChild>
      <IconButton>
        <CrossIcon />
      </IconButton>
    </ToastClose>
  );
};

export const Toast = {
  Provider: ToastPrimitives.Provider,
  Root: ToastRoot,
  Title: ToastTitle,
  Description: ToastDescription,
  Close: DefaultClose,
  Action: ToastAction,
  Viewport: ToastViewport,
};
