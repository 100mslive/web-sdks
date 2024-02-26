import React, { useCallback, useEffect, useRef, useState } from 'react';
import { selectHLSState, selectPeerCount, useHMSStore } from '@100mslive/react-sdk';
import { Flex } from '../../../Layout';
import { Text } from '../../../Text';
// @ts-ignore: No implicit any
import { Logo } from '../Header/HeaderComponents';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore: No implicit Any
import { getFormattedCount } from '../../common/utils';
import { getTime } from './utils';

/*
	player handler --> left -> go live with timer or live, right -> expand icon 
	inbetween -> play pause icon, double tap to go back/forward
	seekbar
	half page will have chat or participant view
*/
export const HLSViewTitle = () => {
  const peerCount = useHMSStore(selectPeerCount);
  const hlsState = useHMSStore(selectHLSState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { screenType } = useRoomLayoutConferencingScreen();
  const [liveTime, setLiveTime] = useState(0);

  const startTimer = useCallback(() => {
    intervalRef.current = setInterval(() => {
      const timeStamp = hlsState?.variants[0]?.[screenType === 'hls_live_streaming' ? 'startedAt' : 'initialisedAt'];
      if (hlsState?.running && timeStamp) {
        setLiveTime(Date.now() - timeStamp.getTime());
      }
    }, 60000);
  }, [hlsState?.running, hlsState?.variants, screenType]);

  useEffect(() => {
    if (hlsState?.running) {
      startTimer();
      const timeStamp = hlsState?.variants[0]?.[screenType === 'hls_live_streaming' ? 'startedAt' : 'initialisedAt'];
      if (hlsState?.running && timeStamp) {
        setLiveTime(Date.now() - timeStamp.getTime());
      }
    }
    if (!hlsState?.running && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [hlsState?.running, hlsState?.variants, screenType, startTimer]);

  return (
    <Flex
      gap="4"
      align="center"
      css={{
        position: 'relative',
        h: 'fit-content',
        w: '100%',
        borderBottom: '1px solid $border_bright',
        p: '$8',
        backgroundColor: '$surface_dim',
      }}
    >
      <Logo />
      <Flex direction="column">
        <Text variant="sub2" css={{ fontWeight: '$semiBold' }}>
          Tech Talk
        </Text>
        <Flex gap="1">
          <Text variant="caption" css={{ color: '$on_surface_medium' }}>
            {getFormattedCount(peerCount) + ' watching'}
          </Text>
          <Flex
            direction="column"
            css={{
              w: '$3',
              h: '$3',
              backgroundColor: '$on_surface_medium',
              borderRadius: '50%',
              alignSelf: 'center',
            }}
          />
          <Text variant="caption" css={{ color: '$on_surface_medium' }}>
            {'Started ' + getTime(liveTime) + ' ago'}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};
