import React, { useContext } from 'react';
import { Button } from '../Button';
import { Box, Flex } from '../Layout';
import { Text } from '../Text';
import { CSS } from '../Theme';
import { hmsDiagnostics } from './hms';

export const DiagnosticsSteps: Record<string, string> = {
  video: 'Test Video',
  audio: 'Test Audio',
  // browser: 'Browser Support',
  connectivity: 'Connection Quality',
};

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

export const TestFooter = ({
  error,
  ctaText,
  children,
}: {
  ctaText?: string;
  error?: Error;
  children?: React.ReactNode;
}) => {
  const { activeStep, setActiveStep } = useContext(DiagnosticsContext);

  const onNextStep = () => {
    if (activeStep === 'audio') {
      hmsDiagnostics.stopMicCheck();
    } else if (activeStep === 'video') {
      hmsDiagnostics.stopCameraCheck();
    } else if (activeStep === 'connectivity') {
      hmsDiagnostics.stopConnectivityCheck();
    }

    const keys = Object.keys(DiagnosticsSteps);
    setActiveStep(step => keys[keys.indexOf(step) + 1]);
  };

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
        '@lg': { flexDirection: 'column', gap: '$8' },
      }}
    >
      <Box>{error && <Text css={{ c: '$alert_error_default' }}>Error: {error.message}</Text>}</Box>
      {children ? (
        children
      ) : (
        <Flex align="center" css={{ gap: '$8', '@lg': { flexDirection: 'column' } }}>
          <Text css={{ c: '$on_primary_medium' }}>{ctaText}</Text>
          <Flex align="center" gap="4">
            <Button onClick={onNextStep} variant="standard" outlined={true}>
              Skip
            </Button>
            <Button disabled={!!error} onClick={onNextStep}>
              Yes
            </Button>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};
