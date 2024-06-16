import React, { useContext } from 'react';
import { HMSRoomProvider } from '@100mslive/react-sdk';
import { ConnectivityIcon, GlobeIcon, MicOnIcon, VideoOnIcon } from '@100mslive/react-icons';
import { DiagnosticsContext, DiagnosticsSteps } from './components';
import { Box, Flex } from '../Layout';
import { Text } from '../Text';
import { HMSThemeProvider } from '../Theme';
import { AudioTest } from './AudioTest';
import { ConnectivityTest } from './ConnectivityTest';
import { hmsActions, hmsNotifications, hmsStats, hmsStore } from './hms';
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
      px: '155px',
      py: '160px',
      bg: '$background_dim',
      lineHeight: '1.5',
      '-webkit-text-size-adjust': '100%',
      position: 'relative',
      minHeight: '100vh',
      '@lg': {
        p: '$12',
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
    <Box css={{ border: '1px solid $border_default', r: '$1', w: '75%', '@lg': { w: '100%' } }}>
      <DiagnosticsStepHeader />
      <DiagnosticsStepTest />
    </Box>
  );
};

const DiagnosticsStepsList = () => {
  const { activeStep } = useContext(DiagnosticsContext);

  return (
    <Box css={{ w: '25%', '@lg': { display: 'none' } }}>
      <ul>
        {Object.keys(DiagnosticsSteps).map(key => (
          <li key={key}>
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
        <DiagnosticsContext.Provider value={{ activeStep, setActiveStep }}>
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
      </HMSThemeProvider>
    </HMSRoomProvider>
  );
};
