import React from 'react';
import { PinIcon, SpotlightIcon } from '@100mslive/react-icons';
import { Flex, styled, Text, textEllipsis } from '../../..';
import { ConnectionIndicator } from './ConnectionIndicator';

const TileConnection = ({
  name,
  peerId,
  hideLabel,
  width,
  spotlighted,
  pinned,
}: {
  name: string;
  peerId: string;
  hideLabel: boolean;
  width?: number;
  spotlighted?: boolean;
  pinned?: boolean;
}) => {
  return (
    <Wrapper>
      {!hideLabel ? (
        <>
          <Flex align="center">
            {pinned && (
              <IconWrapper>
                <PinIcon width="15" height="15" />
              </IconWrapper>
            )}
            {spotlighted && (
              <IconWrapper>
                <SpotlightIcon width="15" height="15" />
              </IconWrapper>
            )}
            <Text
              css={{
                c: '$on_surface_high',
                verticalAlign: 'baseline',
                ...(width ? textEllipsis(width - 60) : {}),
              }}
              variant="xs"
            >
              {name}
            </Text>
          </Flex>
          <ConnectionIndicator isTile peerId={peerId} hideBg />
        </>
      ) : null}
    </Wrapper>
  );
};

const IconWrapper = styled('div', { c: '$on_surface_high', ml: '$3', mt: '$1' });

const Wrapper = styled('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'absolute',
  bottom: '$2',
  left: '$2',
  backgroundColor: '$background_dim',
  borderRadius: '$1',
  maxWidth: '85%',
  '& p,span': {
    p: '$2 $3',
  },
});

export default TileConnection;
