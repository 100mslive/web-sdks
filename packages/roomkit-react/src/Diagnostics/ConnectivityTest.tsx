import React, { useState } from 'react';
import { ConnectivityCheckResult, ConnectivityState, DiagnosticsRTCStats } from '@100mslive/react-sdk';
import { CheckCircleIcon, CrossCircleIcon, EyeCloseIcon, EyeOpenIcon, LinkIcon } from '@100mslive/react-icons';
import { TestContainer, TestFooter } from './components';
import { Button } from '../Button';
import { Box, Flex } from '../Layout';
import { Loading } from '../Loading';
import { formatBytes } from '../Stats';
import { Text } from '../Text';
import { DiagnosticsStep, useDiagnostics } from './DiagnosticsContext';

const Regions = {
  in: 'India',
  us: 'United States',
};

const ConnectivityStateMessage = {
  [ConnectivityState.STARTING]: 'Fetching Init',
  [ConnectivityState.INIT_FETCHED]: 'Connecting to signal server',
  [ConnectivityState.SIGNAL_CONNECTED]: 'Establishing ICE connection',
  [ConnectivityState.ICE_ESTABLISHED]: 'Capturing Media',
  [ConnectivityState.MEDIA_CAPTURED]: 'Publishing Media',
  [ConnectivityState.MEDIA_PUBLISHED]: 'Finishing Up',
  [ConnectivityState.COMPLETED]: 'Completed',
};

export const ConnectivityTestStepResult = ({
  title,
  status = 'Connected',
  success,
  children,
}: {
  title: string;
  status?: string;
  success?: boolean;
  children: React.ReactNode;
}) => {
  const [hideDetails, setHideDetails] = useState(true);

  return (
    <Box css={{ my: '10', p: '10', r: '1', bg: 'surface.bright' }}>
      <Text css={{ c: 'onPrimary.medium', mb: '6' }}>{title}</Text>
      {success ? (
        <Flex>
          <Text css={{ c: 'alert.success' }}>
            <CheckCircleIcon width="1.5rem" height="1.5rem" />
          </Text>
          <Text variant="lg" css={{ ml: '4' }}>
            {status}
          </Text>
        </Flex>
      ) : (
        <Flex>
          <Text css={{ c: 'alert.error.bright' }}>
            <CrossCircleIcon width="1.5rem" height="1.5rem" />
          </Text>
          <Text variant="lg" css={{ ml: '4' }}>
            Failed
          </Text>
        </Flex>
      )}
      <Flex
        onClick={() => setHideDetails(!hideDetails)}
        align="center"
        gap="2"
        css={{
          color: 'primary.bright',
        }}
      >
        {hideDetails ? <EyeOpenIcon /> : <EyeCloseIcon />}
        <Text
          variant="caption"
          css={{
            color: 'primary.bright',
          }}
        >
          {hideDetails ? 'View' : 'Hide'} detailed information
        </Text>
      </Flex>
      {!hideDetails ? <Box>{children}</Box> : null}
    </Box>
  );
};

const DetailedInfo = ({
  title,
  value,
  Icon,
}: {
  title: string;
  value: string;
  Icon?: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
}) => {
  return (
    <Box css={{ flex: '50%', mt: '6' }}>
      <Text variant="caption" css={{ fontWeight: 'semiBold', c: 'onPrimary.medium' }}>
        {title}
      </Text>
      <Flex css={{ mt: 'xs', alignItems: 'flex-start' }}>
        {Icon && (
          <Text css={{ mr: '4' }}>
            <Icon width="1rem" height="1rem" />
          </Text>
        )}
        <Text variant="caption">{value}</Text>
      </Flex>
    </Box>
  );
};

const MediaServerResult = ({ result }: { result?: ConnectivityCheckResult['mediaServerReport'] }) => {
  return (
    <ConnectivityTestStepResult
      title="Media server connection test"
      success={result?.isPublishICEConnected && result.isSubscribeICEConnected}
    >
      <Flex css={{ flexWrap: 'wrap' }}>
        <DetailedInfo
          title="Media Captured"
          value={result?.stats?.audio.bytesSent ? 'Yes' : 'No'}
          Icon={result?.stats?.audio.bytesSent ? CheckCircleIcon : CrossCircleIcon}
        />
        <DetailedInfo
          title="Media Published"
          value={result?.stats?.audio.bitrateSent ? 'Yes' : 'No'}
          Icon={result?.stats?.audio.bytesSent ? CheckCircleIcon : CrossCircleIcon}
        />
        {result?.connectionQualityScore ? (
          <DetailedInfo
            title="Connection Quality Score (CQS)"
            value={`${result.connectionQualityScore.toFixed(2)} (out of 5)`}
          />
        ) : null}
      </Flex>
    </ConnectivityTestStepResult>
  );
};

const SignallingResult = ({ result }: { result?: ConnectivityCheckResult['signallingReport'] }) => {
  return (
    <ConnectivityTestStepResult title="Signalling server connection test" success={result?.isConnected}>
      <Flex css={{ flexWrap: 'wrap' }}>
        <DetailedInfo
          title="Signalling Gateway"
          value={result?.isConnected ? 'Reachable' : 'Unreachable'}
          Icon={result?.isConnected ? CheckCircleIcon : CrossCircleIcon}
        />
        <DetailedInfo title="Websocket URL" value={result?.websocketUrl || 'N/A'} Icon={LinkIcon} />
      </Flex>
    </ConnectivityTestStepResult>
  );
};

const AudioStats = ({ stats }: { stats: DiagnosticsRTCStats | undefined }) => {
  return (
    <ConnectivityTestStepResult title="Audio" status="Received" success={!!stats?.bytesSent}>
      {stats && (
        <Flex css={{ flexWrap: 'wrap' }}>
          <DetailedInfo title="Bytes Sent" value={formatBytes(stats.bytesSent)} />
          <DetailedInfo title="Bytes Received" value={formatBytes(stats.bytesReceived)} />
          <DetailedInfo title="Packets Received" value={stats.packetsReceived.toString()} />
          <DetailedInfo title="Packets Lost" value={stats.packetsLost.toString()} />
          <DetailedInfo title="Bitrate Sent" value={formatBytes(stats.bitrateSent, 'b/s')} />
          <DetailedInfo title="Bitrate Received" value={formatBytes(stats.bitrateReceived, 'b/s')} />
          <DetailedInfo title="Round Trip Time" value={`${stats.roundTripTime} ms`} />
          <DetailedInfo title="Jitter" value={`${stats.jitter * 1000} ms`} />
        </Flex>
      )}
    </ConnectivityTestStepResult>
  );
};

const VideoStats = ({ stats }: { stats: DiagnosticsRTCStats | undefined }) => {
  return (
    <ConnectivityTestStepResult title="Video" status="Received" success={!!stats?.bytesSent}>
      {stats && (
        <Flex css={{ flexWrap: 'wrap' }}>
          <DetailedInfo title="Bytes Sent" value={formatBytes(stats.bytesSent)} />
          <DetailedInfo title="Bytes Received" value={formatBytes(stats.bytesReceived)} />
          <DetailedInfo title="Packets Received" value={stats.packetsReceived.toString()} />
          <DetailedInfo title="Packets Lost" value={stats.packetsLost.toString()} />
          <DetailedInfo title="Bitrate Sent" value={formatBytes(stats.bitrateSent, 'b/s')} />
          <DetailedInfo title="Bitrate Received" value={formatBytes(stats.bitrateReceived, 'b/s')} />
          <DetailedInfo title="Round Trip Time" value={`${stats.roundTripTime} ms`} />
          <DetailedInfo title="Jitter" value={`${stats.jitter * 1000} ms`} />
        </Flex>
      )}
    </ConnectivityTestStepResult>
  );
};

const Footer = ({
  error,
  result,
  restart,
}: {
  result?: ConnectivityCheckResult;
  restart: () => void;
  error?: Error;
}) => {
  return (
    <TestFooter error={error}>
      <Flex css={{ gap: '8', '@lg': { flexDirection: 'column' } }}>
        <Button variant="standard" onClick={restart}>
          Restart Test
        </Button>
        <Button disabled={!result} onClick={() => result && downloadJson(result, 'hms_diagnostics_results')}>
          Download Test Report
        </Button>
      </Flex>
    </TestFooter>
  );
};

const ConnectivityTestReport = ({
  error,
  result,
  progress,
  startTest,
}: {
  error?: Error;
  result?: ConnectivityCheckResult;
  progress?: ConnectivityState;
  startTest: () => void;
}) => {
  if (error) {
    return (
      <>
        <TestContainer css={{ textAlign: 'center' }}>
          <Text css={{ c: 'alert.error.default', mb: '4' }}>
            <CrossCircleIcon />
          </Text>
          <Text variant="h6">Connectivity Test Failed</Text>
          <Text variant="body2" css={{ c: 'onPrimary.medium' }}>
            {error.message}
          </Text>
        </TestContainer>
        <Footer restart={startTest} error={error} />
      </>
    );
  }

  if (result) {
    // for debugging and quick view of results
    console.log(result);
    return (
      <>
        <TestContainer>
          <Text css={{ c: 'onPrimary.medium' }}>Connectivity test has been completed.</Text>
          <SignallingResult result={result?.signallingReport} />
          <MediaServerResult result={result?.mediaServerReport} />
          <AudioStats stats={result?.mediaServerReport?.stats?.audio} />
          <VideoStats stats={result?.mediaServerReport?.stats?.video} />
        </TestContainer>
        <Footer result={result} restart={startTest} error={error} />
      </>
    );
  }

  if (progress !== undefined) {
    return (
      <TestContainer css={{ textAlign: 'center' }}>
        <Text css={{ c: 'primary.bright', display: 'flex', justifyContent: 'center' }}>
          <Loading size="3.5rem" color="currentColor" />
        </Text>
        <Text variant="h6" css={{ mt: '8' }}>
          Checking your connection...
        </Text>
        <Text
          variant="body2"
          css={{ c: 'onPrimary.medium', mt: '4' }}
        >{`${ConnectivityStateMessage[progress]}...`}</Text>
      </TestContainer>
    );
  }

  return null;
};

const RegionSelector = ({
  region,
  setRegion,
  startTest,
}: {
  region?: string;
  startTest?: () => void;
  setRegion: (region: string) => void;
}) => {
  return (
    <TestContainer css={{ borderBottom: '1px solid border.default' }}>
      <Text variant="body1">Select a region</Text>
      <Text variant="body2" css={{ c: 'onSecondary.low' }}>
        Select the closest region for best results
      </Text>
      <Flex
        justify="between"
        css={{
          mt: 'md',
          '@lg': {
            flexDirection: 'column',
            gap: '8',
          },
        }}
      >
        <Flex
          css={{
            gap: '4',
            '@lg': {
              flexDirection: 'column',
            },
          }}
        >
          {Object.entries(Regions).map(([key, value]) => (
            <Button
              key={key}
              outlined={region !== key}
              variant={region === key ? 'primary' : 'standard'}
              css={region === key ? { bg: 'primary.dim' } : {}}
              onClick={() => setRegion(key)}
            >
              {value}
            </Button>
          ))}
        </Flex>
        <Flex css={{ '@lg': { flexDirection: 'column' } }}>
          <Button variant="primary" onClick={startTest} disabled={!startTest}>
            {startTest ? 'Start Test' : 'Testing...'}
          </Button>
        </Flex>
      </Flex>
    </TestContainer>
  );
};

export const ConnectivityTest = () => {
  const { hmsDiagnostics, updateStep } = useDiagnostics();
  const [region, setRegion] = useState<string | undefined>(Object.keys(Regions)[0]);
  const [error, setError] = useState<Error | undefined>();
  const [progress, setProgress] = useState<ConnectivityState>();
  const [result, setResult] = useState<ConnectivityCheckResult | undefined>();

  const startTest = () => {
    updateStep(DiagnosticsStep.CONNECTIVITY, { hasFailed: false, isCompleted: false });
    setError(undefined);
    setResult(undefined);
    hmsDiagnostics
      ?.startConnectivityCheck(
        state => {
          setProgress(state);
        },
        result => {
          updateStep(DiagnosticsStep.CONNECTIVITY, { isCompleted: true });
          setResult(result);
        },
        region,
      )
      .catch(error => {
        updateStep(DiagnosticsStep.CONNECTIVITY, { hasFailed: true });
        setError(error);
      });
  };

  return (
    <>
      <RegionSelector
        region={region}
        setRegion={setRegion}
        startTest={progress === undefined || progress === ConnectivityState.COMPLETED ? startTest : undefined}
      />
      <ConnectivityTestReport error={error} result={result} progress={progress} startTest={startTest} />
    </>
  );
};

const downloadJson = (obj: object, fileName: string) => {
  const a = document.createElement('a');
  const file = new Blob([JSON.stringify(obj, null, 2)], {
    type: 'application/json',
  });
  a.href = URL.createObjectURL(file);
  a.download = `${fileName}.json`;
  a.click();
};
