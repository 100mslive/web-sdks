// @ts-check
import PropTypes from 'prop-types';
import React from 'react';
import { ConnectivityIcon, GlobeIcon, MicOnIcon, VideoOnIcon } from '@100mslive/react-icons';
import { Box, Flex, HMSThemeProvider, Text } from '@100mslive/roomkit-react';
import { HMSRoomProvider } from '@100mslive/react-sdk';
import { AudioTest } from './AudioTest';
import { VideoTest } from './VideoTest';
import { hmsActions, hmsNotifications, hmsStats, hmsStore } from './hms';

const DiagnosticsSteps = {
  audio: 'Test Audio',
  video: 'Test Video',
  browser: 'Browser Support',
  connectivity: 'Connection Quality',
};

const DiagnosticsStepIcon = {
  video: <VideoOnIcon width="2rem" height="2rem" />,
  audio: <MicOnIcon width="2rem" height="2rem" />,
  browser: <GlobeIcon width="2rem" height="2rem" />,
  connectivity: <ConnectivityIcon width="2rem" height="2rem" />,
};

const Container = ({ children }) => (
  <Box
    css={{
      px: '155px',
      py: '160px',
      bg: '$background_dim',
      lineHeight: '1.5',
      '-webkit-text-size-adjust': '100%',
      position: 'relative',
      height: '100vh',
    }}
  >
    {children}
  </Box>
);

Container.propTypes = {
  children: PropTypes.node.isRequired,
};

const DiagnosticsStepTest = ({ activeStep }) => {
  let TestComponent;
  if (activeStep === 'audio') {
    TestComponent = AudioTest;
  } else if (activeStep === 'video') {
    TestComponent = VideoTest;
  }
  return <Box css={{ p: '$10' }}>{TestComponent && <TestComponent />}</Box>;
};

DiagnosticsStepTest.propTypes = {
  activeStep: PropTypes.string.isRequired,
};

const DiagnosticsStepHeader = ({ activeStep }) => {
  return (
    <Flex css={{ py: '$8', px: '$10', alignItems: 'center', borderBottom: '1px solid $border_default' }}>
      <Text css={{ c: '$primary_bright', mt: '$xs' }}>{DiagnosticsStepIcon[activeStep]}</Text>
      <Text css={{ fontSize: '$h6', ml: '$9' }}>{DiagnosticsSteps[activeStep]}</Text>
    </Flex>
  );
};

DiagnosticsStepHeader.propTypes = {
  activeStep: PropTypes.string.isRequired,
};

const DiagnosticsStep = ({ activeStep }) => {
  return (
    <Box css={{ border: '1px solid $border_default', r: '$1' }}>
      <DiagnosticsStepHeader activeStep={activeStep} />
      <DiagnosticsStepTest activeStep={activeStep} />
    </Box>
  );
};

DiagnosticsStep.propTypes = {
  activeStep: PropTypes.string.isRequired,
};

const DiagnosticsStepsList = ({ activeStep, setActiveStep }) => {
  return (
    <ul style={{ width: '25%', marginRight: '3.5rem' }}>
      {Object.keys(DiagnosticsSteps).map(key => (
        <li
          key={key}
          onClick={() => {
            if (activeStep !== key) {
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
  );
};

DiagnosticsStepsList.propTypes = {
  activeStep: PropTypes.string.isRequired,
  setActiveStep: PropTypes.func.isRequired,
};

export const Diagnostics = () => {
  const [activeStep, setActiveStep] = React.useState(Object.keys(DiagnosticsSteps)[0]);
  return (
    <HMSRoomProvider store={hmsStore} actions={hmsActions} notifications={hmsNotifications} stats={hmsStats}>
      <HMSThemeProvider
        themeType="default"
        theme={{
          fonts: {
            sans: ['sans-serif'],
          },
        }}
      >
        <Container>
          <Text variant="h4">Pre-call Test</Text>
          <Text variant="md" css={{ c: '$on_primary_medium' }}>
            {`Make sure your devices and network are good to go, let's get started.`}
          </Text>
          <Flex css={{ direction: 'column', gap: '$14', mt: '$12', justifyItems: 'center' }}>
            <DiagnosticsStepsList activeStep={activeStep} setActiveStep={setActiveStep} />
            <DiagnosticsStep activeStep={activeStep} />
          </Flex>
        </Container>
      </HMSThemeProvider>
    </HMSRoomProvider>
  );
};
