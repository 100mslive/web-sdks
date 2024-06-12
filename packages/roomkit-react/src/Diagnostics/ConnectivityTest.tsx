import React, { useEffect, useState } from 'react';
import { ConnectivityCheckResult, ConnectivityState } from '@100mslive/react-sdk';
import { CrossCircleIcon } from '@100mslive/react-icons';
import { Box } from '../Layout';
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

export const ConnectivityTestStepResult = ({ title }: { title: string }) => {
  return (
    <Box css={{ my: '$10', p: '$10', r: '$1', bg: '$surface_bright' }}>
      <Text css={{ c: '$on_primary_medium' }}>{title}</Text>
    </Box>
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
    console.log(result.errors);
    return (
      <Box css={{ w: '100%' }}>
        <Text css={{ c: '$on_primary_medium' }}>Connectivity test has been completed.</Text>
        <ConnectivityTestStepResult title="Signalling server connection test" />
        <ConnectivityTestStepResult title="Media server connection test" />
      </Box>
    );
  }

  return (
    <Box css={{ w: '100%', textAlign: 'center' }}>
      <Text css={{ c: '$primary_bright', mb: '$4' }}>
        <Loading />
      </Text>
      <Text variant="h6">Checking your connection...</Text>
      <Text variant="body2">{`${ConnectivityStateMessage[progress]}...`}</Text>
    </Box>
  );
};
