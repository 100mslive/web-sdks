import {
  Box,
  Dialog,
  Flex,
  HorizontalDivider,
  Text,
} from '@100mslive/react-ui';

export const DialogContent = ({
  Icon,
  title,
  closeable = true,
  children,
  css,
  iconCSS = {},
  ...props
}) => {
  return (
    <Dialog.Portal>
      <Dialog.Overlay />
      <Dialog.Content css={{ width: 'min(600px, 100%)', ...css }} {...props}>
        <Dialog.Title>
          <Flex justify="between">
            <Flex align="center" css={{ mb: '$1' }}>
              {Icon ? (
                <Box css={{ mr: '$2', color: '$textPrimary', ...iconCSS }}>
                  <Icon />
                </Box>
              ) : null}
              <Text variant="h6" inline>
                {title}
              </Text>
            </Flex>
            {closeable && (
              <Dialog.DefaultClose data-testid="dialoge_cross_icon" />
            )}
          </Flex>
        </Dialog.Title>
        <HorizontalDivider css={{ mt: '$6' }} />
        <Box css={{ w: '100%', h: 'calc(100% - 100px)' }}>{children}</Box>
      </Dialog.Content>
    </Dialog.Portal>
  );
};
