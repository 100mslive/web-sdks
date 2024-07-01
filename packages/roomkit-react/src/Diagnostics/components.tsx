import React, { useContext } from 'react';
import { HMSDiagnosticsInterface } from '@100mslive/react-sdk';
import { Button } from '../Button';
import { Box, Flex } from '../Layout';
import { Text } from '../Text';
import { CSS } from '../Theme';

export const DiagnosticsSteps: Record<string, string> = {
  browser: 'Browser Support',
  video: 'Test Video',
  audio: 'Test Audio',
  connectivity: 'Connection Quality',
};

export const DiagnosticsContext = React.createContext<{
  hmsDiagnostics?: HMSDiagnosticsInterface;
  activeStep: string;
  setActiveStep: React.Dispatch<React.SetStateAction<string>>;
  connectivityTested: boolean;
  setConnectivityTested: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  activeStep: 'video',
  setActiveStep: () => {
    return;
  },
  connectivityTested: false,
  setConnectivityTested: () => {
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
  const { hmsDiagnostics, activeStep, setActiveStep } = useContext(DiagnosticsContext);

  const onNextStep = () => {
    if (activeStep === 'audio') {
      hmsDiagnostics?.stopMicCheck();
    } else if (activeStep === 'video') {
      hmsDiagnostics?.stopCameraCheck();
    } else if (activeStep === 'connectivity') {
      hmsDiagnostics?.stopConnectivityCheck();
    }

    const keys = Object.keys(DiagnosticsSteps);
    setActiveStep(step => keys[keys.indexOf(step) + 1]);
  };

  return (
    <Flex
      css={{
        py: '$8',
        px: '$10',
        background: '$background_dim',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid $border_default',
        fontSize: '$sm',
        borderBottomLeftRadius: '$1',
        borderBottomRightRadius: '$1',
        lineHeight: '$sm',
        zIndex: 1001,
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
