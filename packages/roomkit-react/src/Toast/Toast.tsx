import { ComponentProps, FC, ReactNode } from 'react';
import { Toast as ToastPrimitives } from 'radix-ui';
import { CrossIcon } from '@100mslive/react-icons';
import { IconButton } from '../IconButton';
import { Box, Flex } from '../Layout';
import { Text } from '../Text';
import { styled } from '../Theme';
import { toastAnimation } from '../utils';
type ToastProps = ComponentProps<typeof ToastPrimitives.Root>;

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
    '@sm': {
      '&:before': {
        content: 'none',
      },
      border: `solid $space$px ${base}`,
    },
  };
};

const ToastRoot = styled(ToastPrimitives.Root, {
  r: '$3',
  bg: '$surface_default',
  p: '$10',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  fontFamily: '$sans',
  border: 'solid $space$px $border_bright',
  overflow: 'hidden',
  ...toastAnimation,
  '@sm': {
    p: '$8 $11',
  },
  variants: {
    variant: {
      standard: getToastVariant('$secondary_default'),
      warning: getToastVariant('$alert_warning'),
      error: getToastVariant('$alert_error_default'),
      success: getToastVariant('$alert_success'),
    },
  },
  defaultVariants: {
    variant: 'standard',
  },
});

const ToastTitle = styled(ToastPrimitives.Title, {
  fontSize: '$md',
  color: '$on_surface_high',
  fontWeight: '$semiBold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});
const ToastDescription = styled(ToastPrimitives.Description, {
  color: '$on_surface_medium',
});
const ToastClose = styled(ToastPrimitives.Close, {});
const ToastAction = styled(ToastPrimitives.Action, {
  cursor: 'pointer',
  background: 'none',
  border: 'none',
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
  '@sm': {
    width: '100%',
    padding: '$6',
  },
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

interface HMSToastProps extends ToastProps {
  title: string;
  description?: string;
  isClosable?: boolean;
  icon?: ReactNode;
  action?: ReactNode;
  inlineAction?: boolean;
}

const HMSToast: FC<HMSToastProps> = ({
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
          <Flex align="center" css={{ gap: '$4', flex: '1 1 0', minWidth: 0 }}>
            {icon ? <Box css={{ w: '$10', h: '$10', alignSelf: 'start', mt: '$2' }}>{icon}</Box> : null}
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
            <Text variant="body1" css={{ fontWeight: '$regular', c: '$on_surface_medium' }}>
              {description}
            </Text>
          </ToastDescription>
        ) : null}
        {!inlineAction && action ? (
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
