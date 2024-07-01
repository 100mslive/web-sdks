import React, { useContext, useRef, useState } from 'react';
import { HMSRoomProvider, useHMSActions } from '@100mslive/react-sdk';
import { CheckCircleIcon, ConnectivityIcon, GlobeIcon, MicOnIcon, VideoOnIcon } from '@100mslive/react-icons';
import { DiagnosticsContext, DiagnosticsSteps } from './components';
import { Box, Flex } from '../Layout';
import { Text } from '../Text';
import { HMSThemeProvider } from '../Theme';
import { AudioTest } from './AudioTest';
import { BrowserTest } from './BrowserTest';
import { ConnectivityTest } from './ConnectivityTest';
import { VideoTest } from './VideoTest';

const DiagnosticsStepIcon: Record<string, React.ReactNode> = {
  video: <VideoOnIcon width="2rem" height="2rem" />,
  audio: <MicOnIcon width="2rem" height="2rem" />,
  browser: <GlobeIcon width="2rem" height="2rem" />,
  connectivity: <ConnectivityIcon width="2rem" height="2rem" />,
};

const Container = ({ children }: { children: React.ReactNode }) => (
  <Box
    css={{
      px: '120px',
      pt: '120px',
      pb: '24px',
      bg: '$background_dim',
      lineHeight: '1.5',
      '-webkit-text-size-adjust': '100%',
      position: 'relative',
      h: `calc(100% - 108px)`,
      '@lg': {
        p: '$12',
      },
      overflowY: 'auto',
      '::-webkit-scrollbar-track': {
        WebkitBoxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.3)',
        boxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.3)',
        backgroundColor: 'transparent',
      },
      '::-webkit-scrollbar': {
        width: '6px',
        height: '6px',
        backgroundColor: 'transparent',
      },
      '::-webkit-scrollbar-thumb': {
        backgroundColor: '#657080',
        borderRadius: '5px',
      },
    }}
  >
    {children}
  </Box>
);

const DiagnosticsStepTest = () => {
  const { activeStep } = useContext(DiagnosticsContext);

  let TestComponent = () => <></>;

  if (activeStep === 'audio') {
    TestComponent = AudioTest;
  } else if (activeStep === 'video') {
    TestComponent = VideoTest;
  } else if (activeStep === 'browser') {
    TestComponent = BrowserTest;
  } else if (activeStep === 'connectivity') {
    TestComponent = ConnectivityTest;
  }

  return <TestComponent key={activeStep} />;
};

const DiagnosticsStepHeader = () => {
  const { activeStep } = useContext(DiagnosticsContext);
  return (
    <Flex css={{ py: '$8', px: '$10', alignItems: 'center', borderBottom: '1px solid $border_default' }}>
      <Text css={{ c: '$primary_bright', mt: '$xs' }}>{DiagnosticsStepIcon[activeStep]}</Text>
      <Text css={{ fontSize: '$h6', ml: '$9' }}>{DiagnosticsSteps[activeStep]}</Text>
    </Flex>
  );
};

const DiagnosticsStep = () => {
  return (
    <Box css={{ border: '1px solid $border_default', r: '$1', w: '75%', maxWidth: '65rem', '@lg': { w: '100%' } }}>
      <DiagnosticsStepHeader />
      <DiagnosticsStepTest />
    </Box>
  );
};

const DiagnosticsStepsList = () => {
  const { activeStep, connectivityTested } = useContext(DiagnosticsContext);

  return (
    <Box css={{ w: '25%', '@lg': { display: 'none' } }}>
      {Object.keys(DiagnosticsSteps).map(key => {
        const keys = Object.keys(DiagnosticsSteps);
        const activeStepIndex = keys.indexOf(activeStep);
        const keyIndex = keys.indexOf(key);
        const isStepCompleted = activeStepIndex > keyIndex || (activeStep === 'connectivity' && connectivityTested);

        let color = '$on_primary_low';
        if (activeStep === key) {
          color = '$on_primary_high';
        }
        if (isStepCompleted) {
          color = '$primary_bright';
        }

        return (
          <Flex key={key} css={{ mb: '$10', c: color, gap: '$4', alignItems: 'center' }}>
            {isStepCompleted ? (
              <CheckCircleIcon width="1rem" height="1rem" />
            ) : (
              <Text css={{ c: color, fontSize: '1.75rem' }}>&bull;</Text>
            )}
            <Text css={{ c: color }}>{DiagnosticsSteps[key]}</Text>
          </Flex>
        );
      })}
    </Box>
  );
};

const DiagnosticsProvider = () => {
  const actions = useHMSActions();
  const [activeStep, setActiveStep] = useState(Object.keys(DiagnosticsSteps)[0]);
  const [connectivityTested, setConnectivityTested] = useState(false);
  const diagnosticsRef = useRef(actions.initDiagnostics());

  return (
    <DiagnosticsContext.Provider
      value={{
        hmsDiagnostics: diagnosticsRef.current,
        activeStep,
        setActiveStep,
        connectivityTested,
        setConnectivityTested,
      }}
    >
      <Container>
        <Text variant="h4">Pre-call Test</Text>
        <Text variant="md" css={{ c: '$on_primary_medium' }}>
          Make sure your devices and network are good to go, let's get started.
        </Text>
        <Flex css={{ direction: 'column', mt: '$12', justifyItems: 'center' }}>
          <DiagnosticsStepsList />
          <DiagnosticsStep />
        </Flex>
      </Container>
    </DiagnosticsContext.Provider>
  );
};

export const Diagnostics = () => {
  return (
    <HMSRoomProvider>
      <HMSThemeProvider themeType="default">
        <DiagnosticsProvider />
      </HMSThemeProvider>
    </HMSRoomProvider>
  );
};
