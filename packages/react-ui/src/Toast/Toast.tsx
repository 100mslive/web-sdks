import React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { CrossIcon } from '@100mslive/react-icons';
import { IconButton } from '../IconButton';
import { styled } from '../Theme';

const ToastRoot = styled(ToastPrimitives.Root, {
  r: '$1',
  bg: '$menuBg',
  p: '$8',
  display: 'grid',
  gridTemplateAreas: '"title close" "description close"',
  gridTemplateColumns: 'auto max-content',
});
const ToastTitle = styled(ToastPrimitives.Title, {
  gridArea: 'title',
  fontSize: '$md',
  color: '$textPrimary',
});
const ToastDescription = styled(ToastPrimitives.Description, {
  gridArea: 'description',
  fontSize: '$sm',
  color: '$textSecondary',
});
const ToastClose = styled(ToastPrimitives.Close, {
  gridArea: 'close',
  h: 'max-content',
  placeSelf: 'center',
});
const ToastAction = styled(ToastPrimitives.Action, {
  gridArea: 'action',
});
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
