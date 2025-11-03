import { ReactNode, useCallback, useRef, useState } from 'react';
import { HMSRoomProvider, useHMSActions } from '@100mslive/react-sdk';
import {
  CheckCircleIcon,
  ConnectivityIcon,
  CrossCircleIcon,
  GlobeIcon,
  MicOnIcon,
  VideoOnIcon,
} from '@100mslive/react-icons';
import { Box, Flex } from '../Layout';
import { Text } from '../Text';
import { HMSThemeProvider } from '../Theme';
import { AudioTest } from './AudioTest';
import { BrowserTest } from './BrowserTest';
import { ConnectivityTest } from './ConnectivityTest';
import {
  DiagnosticsContext,
  DiagnosticsStep,
  DiagnosticsStepInfo,
  initialSteps,
  useDiagnostics,
} from './DiagnosticsContext';
import { VideoTest } from './VideoTest';

const DiagnosticsStepIcon: Record<DiagnosticsStep, ReactNode> = {
  [DiagnosticsStep.VIDEO]: <VideoOnIcon width="2rem" height="2rem" />,
  [DiagnosticsStep.AUDIO]: <MicOnIcon width="2rem" height="2rem" />,
  [DiagnosticsStep.BROWSER]: <GlobeIcon width="2rem" height="2rem" />,
  [DiagnosticsStep.CONNECTIVITY]: <ConnectivityIcon width="2rem" height="2rem" />,
};

const Container = ({ children }: { children: ReactNode }) => (
  <Box
    css={{
      px: '120px',
      pt: '120px',
      pb: '24px',
      bg: '$background_dim',
      lineHeight: '1.5',
      '-webkit-text-size-adjust': '100%',
      position: 'relative',
      h: '100%',
      '@lg': {
        p: '$12',
      },
      overflowY: 'auto',
      boxSizing: 'border-box',
      '& *': {
        boxSizing: 'border-box',
      },
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
  const { activeStepIndex } = useDiagnostics();

  let TestComponent = () => <></>;

  if (activeStepIndex === DiagnosticsStep.AUDIO) {
    TestComponent = AudioTest;
  } else if (activeStepIndex === DiagnosticsStep.VIDEO) {
    TestComponent = VideoTest;
  } else if (activeStepIndex === DiagnosticsStep.BROWSER) {
    TestComponent = BrowserTest;
  } else if (activeStepIndex === DiagnosticsStep.CONNECTIVITY) {
    TestComponent = ConnectivityTest;
  }

  return <TestComponent key={activeStepIndex} />;
};

const DiagnosticsStepHeader = () => {
  const { activeStepIndex, activeStep } = useDiagnostics();
  return (
    <Flex css={{ py: '$8', px: '$10', alignItems: 'center', borderBottom: '1px solid $border_default' }}>
      <Text css={{ c: '$primary_bright', mt: '$xs' }}>{DiagnosticsStepIcon[activeStepIndex]}</Text>
      <Text css={{ fontSize: '$h6', ml: '$9' }}>{activeStep.name}</Text>
    </Flex>
  );
};

const DiagnosticsStepContainer = () => {
  return (
    <Box css={{ border: '1px solid $border_default', r: '$1', w: '75%', maxWidth: '65rem', '@lg': { w: '100%' } }}>
      <DiagnosticsStepHeader />
      <DiagnosticsStepTest />
    </Box>
  );
};

const DiagnosticsStepsList = () => {
  const { activeStepIndex, activeStep, steps } = useDiagnostics();

  return (
    <Box css={{ w: '25%', '@lg': { display: 'none' } }}>
      {Object.keys(DiagnosticsStep)
        .filter(key => !isNaN(Number(key)))
        .map(key => {
          const keyIndex = Number(key);
          const step = steps[keyIndex as DiagnosticsStep];
          const isStepCompleted = activeStepIndex > keyIndex || activeStep.isCompleted;

          let color = '$on_primary_low';
          let icon = <Text css={{ c: color, fontSize: '1.75rem' }}>&bull;</Text>;

          if (activeStepIndex === keyIndex) {
            color = '$on_primary_high';
            icon = <Text css={{ c: color, fontSize: '1.75rem' }}>&bull;</Text>;
          }
          if (isStepCompleted) {
            color = '$primary_bright';
            icon = <CheckCircleIcon width="1rem" height="1rem" />;
          }
          if (step.hasFailed) {
            color = '$alert_error_default';
            icon = <CrossCircleIcon width="1rem" height="1rem" />;
          }

          return (
            <Flex key={key} css={{ mb: '$10', c: color, gap: '$4', alignItems: 'center' }}>
              {icon}
              <Text css={{ c: color }}>{step.name}</Text>
            </Flex>
          );
        })}
    </Box>
  );
};

const DiagnosticsProvider = () => {
  const actions = useHMSActions();
  const [activeStep, setActiveStep] = useState(0);
  const [steps, setSteps] = useState(initialSteps);
  const diagnosticsRef = useRef(actions.initDiagnostics());

  const updateStep = useCallback((step: DiagnosticsStep, value: Omit<DiagnosticsStepInfo, 'name'>) => {
    setSteps(prevSteps => ({ ...prevSteps, [step]: { ...prevSteps[step], ...value } }));
  }, []);

  return (
    <DiagnosticsContext.Provider
      value={{
        hmsDiagnostics: diagnosticsRef.current,
        activeStepIndex: activeStep,
        setActiveStep,
        steps,
        updateStep,
      }}
    >
      <Container>
        <Text variant="h4">Pre-call Test</Text>
        <Text variant="md" css={{ c: '$on_primary_medium' }}>
          Make sure your devices and network are good to go, let's get started.
        </Text>
        <Flex css={{ direction: 'column', mt: '$12', justifyItems: 'center' }}>
          <DiagnosticsStepsList />
          <DiagnosticsStepContainer />
        </Flex>
      </Container>
    </DiagnosticsContext.Provider>
  );
};

export const Diagnostics = () => {
  return (
    <HMSRoomProvider>
      {/* @ts-ignore - React 19 namespace mismatch */}
      <HMSThemeProvider themeType="default">
        <DiagnosticsProvider />
      </HMSThemeProvider>
    </HMSRoomProvider>
  );
};
