import * as ToastPrimitives from '@radix-ui/react-toast';
import { styled } from '../Theme';

const ToastRoot = styled(ToastPrimitives.Root, {});
const ToastTitle = styled(ToastPrimitives.Title, {});
const ToastDescription = styled(ToastPrimitives.Description, {});
const ToastClose = styled(ToastPrimitives.Close, {});
const ToastAction = styled(ToastPrimitives.Action, {});

export const Toast = {
  Provider: ToastPrimitives.Provider,
  Root: ToastRoot,
  Title: ToastTitle,
  Description: ToastDescription,
  Close: ToastClose,
  Action: ToastAction,
  Viewport: ToastPrimitives.Viewport,
};
