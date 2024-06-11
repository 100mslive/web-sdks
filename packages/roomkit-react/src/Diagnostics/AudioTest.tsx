import React from 'react';
import { Button } from '../Button';
import { Box } from '../Layout';
import { Text } from '../Text';
import { hmsDiagnostics } from './hms';

export const AudioTest = () => {
  return (
    <Box>
      <Text variant="body2" css={{ c: '$on_primary_medium' }}>
        {`Record an audio clip and play it back to check that your microphone and speaker are working. If they aren't,
        make sure your volume is turned up, try a different speaker or microphone, or check your bluetooth settings.`}
      </Text>

      <Button
        onClick={() => {
          hmsDiagnostics.startMicCheck();
        }}
      >
        Record
      </Button>
    </Box>
  );
};
