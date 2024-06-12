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

// const ConnectivityTestResult = ({ result }) => {
//   return {};
// };

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
    console.log({ error });
    return (
      <Box css={{ textAlign: 'center' }}>
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
    // return (
    // )
  }

  return (
    <Box css={{ textAlign: 'center' }}>
      <Text css={{ c: '$primary_bright', mb: '$4' }}>
        <Loading />
      </Text>
      <Text variant="h6">Checking your connection...</Text>
      <Text variant="body2">{`${ConnectivityStateMessage[progress]}...`}</Text>
    </Box>
  );
};
