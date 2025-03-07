import React from 'react';
import {
  HMSPeerType,
  selectPeerTypeByID,
  selectScreenShareByPeerID,
  selectSessionStore,
  useHMSStore,
} from '@100mslive/react-sdk';
import { CallIcon, PinIcon, ShareScreenIcon, SpotlightIcon } from '@100mslive/react-icons';
import { Flex, styled, Text, textEllipsis } from '../../..';
import { ConnectionIndicator } from './ConnectionIndicator';
import { SESSION_STORE_KEY } from '../../common/constants';

const TileConnection = ({
  name,
  peerId,
  hideLabel,
  width,
  pinned,
}: {
  name: string;
  peerId: string;
  hideLabel: boolean;
  width?: string | number;
  pinned?: boolean;
}) => {
  const spotlightPeerIds = useHMSStore(selectSessionStore(SESSION_STORE_KEY.SPOTLIGHT)) as string[] | undefined;
  const spotlighted = spotlightPeerIds?.includes(peerId);
  const isPeerScreenSharing = !!useHMSStore(selectScreenShareByPeerID(peerId));
  const peerType = useHMSStore(selectPeerTypeByID(peerId));
  return (
    <Wrapper>
      {!hideLabel ? (
        <>
          {name ? (
            <Flex align="center">
              {peerType === HMSPeerType.SIP && (
                <IconWrapper>
                  <CallIcon width="15" height="15" />
                </IconWrapper>
              )}
              {isPeerScreenSharing && (
                <IconWrapper>
                  <ShareScreenIcon width="15" height="15" />
                </IconWrapper>
              )}
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
                  ...(width ? textEllipsis((width as number) - 60) : {}),
                }}
                variant="xs"
              >
                {name}
              </Text>
            </Flex>
          ) : null}
          <ConnectionIndicator isTile peerId={peerId} hideBg />
        </>
      ) : null}
    </Wrapper>
  );
};

const IconWrapper = styled('div', { c: '$on_surface_high', ml: '$3', mt: '$1', display: 'flex' });

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
  zIndex: 1,
  '& p,span': {
    p: '$2 $3',
  },
});

export default TileConnection;
