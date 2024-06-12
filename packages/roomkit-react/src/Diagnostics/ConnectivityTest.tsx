import React, { useEffect, useState } from 'react';
import { ConnectivityCheckResult, ConnectivityState, DiagnosticsRTCStats } from '@100mslive/react-sdk';
import { CheckCircleIcon, CrossCircleIcon, LinkIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../Layout';
import { Loading } from '../Loading';
import { Text } from '../Text';
import { hmsDiagnostics } from './hms';

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
  success,
  children,
}: {
  title: string;
  success?: boolean;
  children: React.ReactNode;
}) => {
  return (
    <Box css={{ my: '$10', p: '$10', r: '$1', bg: '$surface_bright' }}>
      <Text css={{ c: '$on_primary_medium', mb: '$6' }}>{title}</Text>
      {success ? (
        <Flex>
          <Text css={{ c: '$alert_success' }}>
            <CheckCircleIcon width="1.5rem" height="1.5rem" />
          </Text>
          <Text variant="lg" css={{ ml: '$4' }}>
            Connected
          </Text>
        </Flex>
      ) : (
        <Flex>
          <Text css={{ c: '$alert_error_bright' }}>
            <CrossCircleIcon width="1.5rem" height="1.5rem" />
          </Text>
          <Text variant="lg" css={{ ml: '$4' }}>
            Failed
          </Text>
        </Flex>
      )}
      <Box>{children}</Box>
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
    <Box css={{ flex: '50%', mt: '$6' }}>
      <Text variant="caption" css={{ fontWeight: '$semiBold', c: '$on_primary_medium' }}>
        {title}
      </Text>
      <Flex css={{ mt: '$xs', alignItems: 'flex-start' }}>
        {Icon && (
          <Text>
            <Icon width="1rem" height="1rem" />
          </Text>
        )}
        <Text variant="caption" css={{ ml: '$4' }}>
          {value}
        </Text>
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
          <DetailedInfo title="Connection Quality Score (CQS)" value={`${result.connectionQualityScore} (out of 5)`} />
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
    <ConnectivityTestStepResult title="Audio" success={!!stats?.bytesSent}>
      {stats && (
        <Flex css={{ flexWrap: 'wrap' }}>
          <DetailedInfo title="Bytes Sent" value={stats.bytesSent.toString()} />
          <DetailedInfo title="Bytes Received" value={stats.bytesReceived.toString()} />
          <DetailedInfo title="Packets Received" value={stats.packetsReceived.toString()} />
          <DetailedInfo title="Packets Lost" value={stats.packetsLost.toString()} />
          <DetailedInfo title="Bitrate Sent" value={stats.bitrateSent.toString()} />
          <DetailedInfo title="Bitrate Received" value={stats.bitrateReceived.toString()} />
          <DetailedInfo title="Round Trip Time" value={stats.roundTripTime.toString()} />
        </Flex>
      )}
    </ConnectivityTestStepResult>
  );
};

export const ConnectivityTest = () => {
  const [error, setError] = useState<Error | undefined>();
  const [progress, setProgress] = useState<ConnectivityState>(ConnectivityState.STARTING);
  const [result, setResult] = useState<ConnectivityCheckResult | undefined>();

  useEffect(() => {
    hmsDiagnostics
      .startConnectivityCheck(
        state => {
          setProgress(state);
        },
        result => {
          setResult(result);
        },
      )
      .catch(error => {
        setError(error);
      });
  }, []);

  if (error) {
    return (
      <Box css={{ w: '100%', textAlign: 'center' }}>
        <Text css={{ c: '$alert_error_default', mb: '$4' }}>
          <CrossCircleIcon />
        </Text>
        <Text variant="h6">Connectivity Test Failed</Text>
        <Text variant="body2" css={{ c: '$on_primary_medium' }}>
          {error.message}
        </Text>
      </Box>
    );
  }

  if (result) {
    console.log(result);
    return (
      <Box css={{ w: '100%' }}>
        <Text css={{ c: '$on_primary_medium' }}>Connectivity test has been completed.</Text>
        <SignallingResult result={result?.signallingReport} />
        <MediaServerResult result={result?.mediaServerReport} />
        <AudioStats stats={result?.mediaServerReport?.stats?.audio} />
      </Box>
    );
  }

  return (
    <Box css={{ w: '100%', textAlign: 'center' }}>
      <Text css={{ c: '$primary_bright' }}>
        <Loading size="3.5rem" color="currentColor" />
      </Text>
      <Text variant="h6" css={{ mt: '$8' }}>
        Checking your connection...
      </Text>
      <Text
        variant="body2"
        css={{ c: '$on_primary_medium', mt: '$4' }}
      >{`${ConnectivityStateMessage[progress]}...`}</Text>
    </Box>
  );
};
