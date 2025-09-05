import React from 'react';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { Duration } from './Duration';

export const RoomDetailsRow = ({ details }: { details: (string | Date)[] }) => {
  return (
    <Flex align="center" css={{ w: '100%' }}>
      {details.map((detail, index) => (
        <React.Fragment key={detail.toString()}>
          {index > 0 && <Box css={{ h: '2', w: '2', r: 'round', bg: 'onSurface.medium', m: '0 $2' }} />}
          {typeof detail !== 'string' ? (
            <Duration timestamp={detail} />
          ) : (
            <Text variant="xs" css={{ c: 'onSurface.medium' }}>
              {detail}
            </Text>
          )}
        </React.Fragment>
      ))}
    </Flex>
  );
};
