import React from 'react';
import type { ToastProps } from '@radix-ui/react-toast';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { CrossIcon } from '@100mslive/react-icons';
import { IconButton } from '../IconButton';
import { Box, Flex } from '../Layout';
import { cva, styled } from '../styled-system';
import { Text } from '../Text';
import { toastAnimation } from '../utils';

const getToastVariant = (base: string) => {
  return {
    borderLeftColor: base,
    borderLeft: '0',
    '&:before': {
      position: 'absolute',
      top: '-1px',
      left: 'token(spacing.-4)',
      width: 'token(spacing.8)',
      borderLeft: `solid 1px ${base}`,
      borderTop: `solid 1px ${base}`,
      borderBottom: `solid 1px ${base}`,
      borderTopLeftRadius: 'token(radii.3)',
      borderBottomLeftRadius: 'token(radii.3)',
      backgroundColor: base,
      content: '" "',
      height: '100%',
      zIndex: '10',
    },
  };
};

const toastRootVariants = cva({
  base: {
    borderRadius: 'token(radii.3)',
    backgroundColor: 'surface.default',
    padding: 'token(spacing.10)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    fontFamily: 'sans',
    border: '1px solid token(colors.border.bright)',
    overflow: 'hidden',
    ...toastAnimation,
  },
  variants: {
    variant: {
      standard: getToastVariant('token(colors.secondary.default)'),
      warning: getToastVariant('token(colors.alert.warning)'),
      error: getToastVariant('token(colors.alert.error.default)'),
      success: getToastVariant('token(colors.alert.success)'),
    },
  },
  defaultVariants: {
    variant: 'standard',
  },
});

const ToastRoot = styled(ToastPrimitives.Root, toastRootVariants);

const ToastTitle = styled(ToastPrimitives.Title, {
  base: {
    fontSize: 'md',
    color: 'onSurface.high',
    fontWeight: 'semiBold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

const ToastDescription = styled(ToastPrimitives.Description, {
  base: {
    color: 'onSurface.medium',
  },
});

const ToastClose = styled(ToastPrimitives.Close, {});

const ToastAction = styled(ToastPrimitives.Action, {
  base: {
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
});

const ToastViewport = styled(ToastPrimitives.Viewport, {
  base: {
    position: 'fixed',
    bottom: '0',
    left: '0',
    display: 'flex',
    flexDirection: 'column',
    padding: 'token(spacing.8)',
    gap: '10px',
    width: '390px',
    maxWidth: '100vw',
    margin: '0',
    listStyle: 'none',
    zIndex: '1000',
  },
  conditions: {
    sm: {
      width: '100%',
      padding: 'token(spacing.6)',
    },
  },
});

const DefaultClose = ({ style }: { style?: Record<string, any> }) => {
  return (
    <ToastClose style={style} asChild>
      <IconButton>
        <CrossIcon />
      </IconButton>
    </ToastClose>
  );
};

interface HMSToastProps extends ToastProps {
  title: string;
  description?: string;
  isClosable?: boolean;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  inlineAction?: boolean;
}

const HMSToast: React.FC<HMSToastProps> = ({
  title,
  description,
  isClosable = true,
  icon,
  action,
  inlineAction = false,
  ...props
}) => {
  return (
    <>
      <ToastRoot {...props}>
        <ToastTitle>
          <Flex align="center" css={{ gap: '4', flex: '1 1 0', minWidth: 0 }}>
            {icon ? <Box css={{ w: '10', h: '10', alignSelf: 'start', mt: '2' }}>{icon}</Box> : null}
            <Text variant="sub1" css={{ c: 'inherit', wordBreak: 'break-word' }}>
              {title}
            </Text>
          </Flex>
          {isClosable ? <DefaultClose /> : null}
          {!isClosable && inlineAction && action ? (
            <ToastAction altText={`${title}Action`}>{action}</ToastAction>
          ) : null}
        </ToastTitle>
        {description ? (
          <ToastDescription>
            <Text variant="body1" css={{ fontWeight: 'regular', c: 'onSurface.medium' }}>
              {description}
            </Text>
          </ToastDescription>
        ) : null}
        {!inlineAction && action ? (
          <ToastAction altText={`${title}Action`} css={{ mt: '10' }}>
            {action}
          </ToastAction>
        ) : null}
      </ToastRoot>
    </>
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
  HMSToast: HMSToast,
};
