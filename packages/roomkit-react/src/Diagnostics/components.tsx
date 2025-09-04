import React from 'react';
import { Button } from '../Button';
import { Box, Flex } from '../Layout';
import { Text } from '../Text';
import { DiagnosticsStep, useDiagnostics } from './DiagnosticsContext';

export const TestContainer = ({ css: cssStyle, children }: { css?: any; children: React.ReactNode }) => {
  return <Box css={{ p: '$10', ...cssStyle }}>{children}</Box>;
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
  const { hmsDiagnostics, activeStepIndex: activeStep, setActiveStep } = useDiagnostics();

  const onNextStep = () => {
    if (activeStep === DiagnosticsStep.AUDIO) {
      hmsDiagnostics?.stopMicCheck();
    } else if (activeStep === DiagnosticsStep.VIDEO) {
      hmsDiagnostics?.stopCameraCheck();
    } else if (activeStep === DiagnosticsStep.CONNECTIVITY) {
      hmsDiagnostics?.stopConnectivityCheck();
    }

    setActiveStep(step => step + 1);
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
