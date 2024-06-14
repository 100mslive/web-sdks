import React from 'react';
import { HMSRoomProvider } from '@100mslive/react-sdk';
import { ConnectivityIcon, GlobeIcon, MicOnIcon, VideoOnIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../Layout';
import { Text } from '../Text';
import { HMSThemeProvider } from '../Theme';
import { AudioTest } from './AudioTest';
import { ConnectivityTest } from './ConnectivityTest';
import { hmsActions, hmsDiagnostics, hmsNotifications, hmsStats, hmsStore } from './hms';
import { VideoTest } from './VideoTest';

const DiagnosticsSteps: Record<string, string> = {
  video: 'Test Video',
  audio: 'Test Audio',
  // browser: 'Browser Support',
  connectivity: 'Connection Quality',
};

const DiagnosticsStepIcon: Record<string, React.ReactNode> = {
  video: <VideoOnIcon width="2rem" height="2rem" />,
  audio: <MicOnIcon width="2rem" height="2rem" />,
  browser: <GlobeIcon width="2rem" height="2rem" />,
  connectivity: <ConnectivityIcon width="2rem" height="2rem" />,
};

const Container = ({ children }: { children: React.ReactNode }) => (
  <Box
    css={{
      px: '155px',
      py: '160px',
      bg: '$background_dim',
      lineHeight: '1.5',
      '-webkit-text-size-adjust': '100%',
      position: 'relative',
      minHeight: '100vh',
    }}
  >
    {children}
  </Box>
);

const DiagnosticsStepTest = ({ activeStep }: { activeStep: string }) => {
  let TestComponent = () => <></>;
  if (activeStep === 'audio') {
    TestComponent = AudioTest;
  } else if (activeStep === 'video') {
    TestComponent = VideoTest;
  } else if (activeStep === 'connectivity') {
    TestComponent = ConnectivityTest;
  }
  return <TestComponent key={activeStep} />;
};

const DiagnosticsStepHeader = ({ activeStep }: { activeStep: string }) => {
  return (
    <Flex css={{ py: '$8', px: '$10', alignItems: 'center', borderBottom: '1px solid $border_default' }}>
      <Text css={{ c: '$primary_bright', mt: '$xs' }}>{DiagnosticsStepIcon[activeStep]}</Text>
      <Text css={{ fontSize: '$h6', ml: '$9' }}>{DiagnosticsSteps[activeStep]}</Text>
    </Flex>
  );
};

const DiagnosticsStep = ({ activeStep }: { activeStep: string }) => {
  return (
    <Box css={{ border: '1px solid $border_default', r: '$1', w: '75%' }}>
      <DiagnosticsStepHeader activeStep={activeStep} />
      <DiagnosticsStepTest activeStep={activeStep} />
    </Box>
  );
};

const DiagnosticsStepsList = ({
  activeStep,
  setActiveStep,
}: {
  activeStep: string;
  setActiveStep: (step: string) => void;
}) => {
  const stopCurrentCheck = () => {
    if (activeStep === 'audio') {
      hmsDiagnostics.stopMicCheck();
    } else if (activeStep === 'video') {
      hmsDiagnostics.stopCameraCheck();
    } else if (activeStep === 'connectivity') {
      hmsDiagnostics.stopConnectivityCheck();
    }
  };

  return (
    <Box css={{ w: '25%' }}>
      <ul>
        {Object.keys(DiagnosticsSteps).map(key => (
          <li
            key={key}
            onClick={() => {
              if (activeStep !== key) {
                stopCurrentCheck();
                setActiveStep(key);
              }
            }}
          >
            <Text variant="md" css={{ mb: '$10', c: activeStep === key ? '$on_primary_high' : '$on_primary_low' }}>
              {DiagnosticsSteps[key]}
            </Text>
          </li>
        ))}
      </ul>
    </Box>
  );
};

export const Diagnostics = () => {
  const [activeStep, setActiveStep] = React.useState(Object.keys(DiagnosticsSteps)[0]);
  return (
    <HMSRoomProvider store={hmsStore} actions={hmsActions} notifications={hmsNotifications} stats={hmsStats}>
      <HMSThemeProvider themeType="default">
        <Container>
          <Text variant="h4">Pre-call Test</Text>
          <Text variant="md" css={{ c: '$on_primary_medium' }}>
            Make sure your devices and network are good to go, let's get started.
          </Text>
          <Flex css={{ direction: 'column', mt: '$12', justifyItems: 'center' }}>
            <DiagnosticsStepsList activeStep={activeStep} setActiveStep={setActiveStep} />
            <DiagnosticsStep activeStep={activeStep} />
          </Flex>
        </Container>
      </HMSThemeProvider>
    </HMSRoomProvider>
  );
};
