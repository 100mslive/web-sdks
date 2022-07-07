import React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { CrossIcon } from '@100mslive/react-icons';
import { IconButton } from '../IconButton';
import { styled } from '../Theme';
import { toastAnimation } from '../utils';
import { Flex, Box } from '../Layout';
import { Text } from '../Text';

const ToastRoot = styled(ToastPrimitives.Root, {
  r: '$3',
  bg: '$surfaceDefault',
  p: '$8',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  fontFamily: '$sans',
  borderTop: 'solid $space$px $borderLight',
  borderBottom: 'solid $space$px $borderLight',
  borderRight: 'solid $space$px $borderLight',
  ...toastAnimation,
  variants: {
    variant: {
      standard: {
        borderLeft: 'solid $space$4 $secondaryDefault',
      },
      warning: {
        borderLeft: 'solid $space$4 $warning',
      },
      error: {
        borderLeft: 'solid $space$4 $error',
      },
      success: {
        borderLeft: 'solid $space$4 $success',
      },
    },
  },
  defaultVariants: {
    variant: 'standard',
  },
});

const ToastTitle = styled(ToastPrimitives.Title, {
  fontSize: '$md',
  lineHeight: '$md',
  color: '$textPrimary',
  fontWeight: 600,
  mr: '$12',
});
const ToastDescription = styled(ToastPrimitives.Description, {
  color: '$textSecondary',
  mr: '$17',
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

const DefaultClose = ({ ...props }) => {
  return (
    <ToastClose {...props} asChild>
      <IconButton>
        <CrossIcon />
      </IconButton>
    </ToastClose>
  );
};

const ReactToast = ({ title, description, icon, cta, isClosable, ...props }) => {
  const Icon = icon;
  return (
    <>
      <ToastRoot {...props}>
        {isClosable ? (
          <DefaultClose
            css={{
              w: '$10',
              h: '$10',
              right: '$4',
              top: cta || description ? '$md' : '50%',
            }}
          />
        ) : null}
        <ToastTitle css={{ mb: description ? (cta ? '$4' : '$24') : 0 }}>
          <Flex css={{ display: 'flex', flexDirection: 'row', w: '100%', gap: Icon ? '$4' : 0 }}>
            {Icon ? <Box css={{ w: '$10', h: '$10' }}>{<Icon />}</Box> : null}
            <Box>{title}</Box>
          </Flex>
        </ToastTitle>
        {cta || description ? (
          <ToastDescription css={{ mr: '$12' }}>
            <Flex css={{ display: 'flex', flexDirection: 'column', w: '100%' }}>
              {description ? (
                <Text variant="body1" css={{ fontWeight: '$regular', mb: cta ? '$10' : 0, c: '$textMedEmp' }}>
                  {description}
                </Text>
              ) : null}
              {cta ? cta : null}
            </Flex>
          </ToastDescription>
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
  DefaultToast: ReactToast,
};
