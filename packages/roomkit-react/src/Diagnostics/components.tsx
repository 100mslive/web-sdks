import React from 'react';
import { Box, Flex } from '../Layout';
import { Text } from '../Text';
import { CSS } from '../Theme';

export const DiagnosticsContext = React.createContext<{
  activeStep: string;
  setActiveStep: React.Dispatch<React.SetStateAction<string>>;
}>({
  activeStep: 'video',
  setActiveStep: () => {
    return;
  },
});

export const TestContainer = ({ css, children }: { css?: CSS; children: React.ReactNode }) => {
  return <Box css={{ p: '$10', ...css }}>{children}</Box>;
};

export const TestFooter = ({ error, children }: { error?: Error; children?: React.ReactNode }) => {
  return (
    <Flex
      css={{
        py: '$8',
        px: '$10',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid $border_default',
        fontSize: '$sm',
        lineHeight: '$sm',
      }}
    >
      <Box>{error && <Text css={{ c: '$alert_error_default' }}>Error: {error.message}</Text>}</Box>
      {children}
    </Flex>
  );
};
