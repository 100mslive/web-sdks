import React, { ComponentProps } from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { CrossIcon } from '@100mslive/react-icons';
import { IconButton } from '../IconButton';
import { Flex, Box } from '../Layout';
import { Text } from '../Text';
import { styled } from '../Theme';
import { toastAnimation } from '../utils';

const getToastVariant = (base: string) => {
  return {
    borderLeftColor: base,
    borderLeft: 0,
    '&:before': {
      position: 'absolute',
      top: '-1px',
      left: '-$4',
      width: '$8',
      borderLeft: `solid $space$px ${base}`,
      borderTop: `solid $space$px ${base}`,
      borderBottom: `solid $space$px ${base}`,
      borderTopLeftRadius: '$3',
      borderBottomLeftRadius: '$3',
      bg: base,
      content: ' ',
      height: '100%',
      zIndex: 10,
    },
  };
};

const ToastRoot = styled(ToastPrimitives.Root, {
  r: '$3',
  bg: '$surfaceDefault',
  p: '$10',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  fontFamily: '$sans',
  border: 'solid $space$px $borderLight',
  overflow: 'hidden',
  ...toastAnimation,
  variants: {
    variant: {
      standard: getToastVariant('$secondaryDefault'),
      warning: getToastVariant('$warning'),
      error: getToastVariant('$error'),
      success: getToastVariant('$success'),
    },
  },
  defaultVariants: {
    variant: 'standard',
  },
});

const ToastTitle = styled(ToastPrimitives.Title, {
  fontSize: '$md',
  color: '$textHighEmp',
  fontWeight: '$semiBold',
  display: 'flex',
  alignItems: 'start',
  justifyContent: 'space-between',
});
const ToastDescription = styled(ToastPrimitives.Description, {
  color: '$textMedEmp',
});
const ToastClose = styled(ToastPrimitives.Close, {});
const ToastAction = styled(ToastPrimitives.Action, {
  cursor: 'pointer',
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

const DefaultClose = ({ css }: Pick<ComponentProps<typeof ToastClose>, 'css'>) => {
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
        <ToastTitle>
          <Flex align="center" css={{ gap: '$4', flex: '1 1 0', minWidth: 0 }}>
            {icon ? <Box css={{ w: '$10', h: '$10', alignSelf: 'start', mt: '$2' }}>{icon}</Box> : null}
            <Text variant="sub1" css={{ c: 'inherit', wordBreak: 'break-all' }}>
              {title}
            </Text>
          </Flex>
          {isClosable ? <DefaultClose /> : null}
        </ToastTitle>
        {description ? (
          <ToastDescription>
            <Text variant="body1" css={{ fontWeight: '$regular', c: '$textMedEmp' }}>
              {description}
            </Text>
          </ToastDescription>
        ) : null}
        {action ? (
          <ToastAction altText={`${title}Action`} css={{ mt: '$10' }}>
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
