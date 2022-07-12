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
  border: 'solid $space$px $borderLight',
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
  color: '$textPrimary',
  fontWeight: '$semiBold',
  mr: '$12',
});
const ToastDescription = styled(ToastPrimitives.Description, {
  color: '$textSecondary',
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

const DefaultClose = ({ css }) => {
  return (
    <ToastClose css={css} asChild>
      <IconButton>
        <CrossIcon />
      </IconButton>
    </ToastClose>
  );
};

interface HMSToastProps extends ToastPrimitives.ToastProps {
  title: string;
  description?: string;
  isClosable?: boolean;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const HMSToast: React.FC<HMSToastProps> = ({ title, description, isClosable = true, icon, action, ...props }) => {
  return (
    <>
      <ToastRoot {...props}>
        {isClosable ? (
          <DefaultClose
            css={{
              w: '$10',
              h: '$10',
              right: '$4',
              top: action || description ? '$md' : '50%',
            }}
          />
        ) : null}
        <ToastTitle css={{ mb: action ? (description ? 0 : '$10') : 0, c: '$textHighEmp' }}>
          <Flex align="center" css={{ display: 'flex', flexDirection: 'row', w: '100%', gap: icon ? '$4' : 0 }}>
            {icon ? <Box css={{ w: '$10', h: '$10' }}>{icon}</Box> : null}
            <Text variant="sub1" css={{ c: '$textHighEmp' }}>
              {title}
            </Text>
          </Flex>
        </ToastTitle>
        {action || description ? (
          <ToastDescription css={{ mr: '$12' }}>
            <Flex css={{ display: 'flex', flexDirection: 'column', w: '100%' }}>
              {description ? (
                <Text variant="body1" css={{ fontWeight: '$regular', mb: action ? '$10' : 0, c: '$textMedEmp' }}>
                  {description}
                </Text>
              ) : null}
              {action ? action : null}
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
  DefaultToast: HMSToast,
};
