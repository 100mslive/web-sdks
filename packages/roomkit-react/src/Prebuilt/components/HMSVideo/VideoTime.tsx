import React, { useEffect, useState } from 'react';
import { HMSHLSPlayerEvents } from '@100mslive/hls-player';
import { Text } from '../../../Text';
import { useHMSPlayerContext } from './PlayerContext';
import { getDurationFromSeconds } from './utils';

export const VideoTime = () => {
  const { hlsPlayer } = useHMSPlayerContext();
  const [videoTime, setVideoTime] = useState('');

  useEffect(() => {
    const timeupdateHandler = (currentTime: number) => {
      const videoEl = hlsPlayer?.getVideoElement();
      if (videoEl) {
        setVideoTime(getDurationFromSeconds(videoEl.duration - currentTime));
      } else {
        setVideoTime(getDurationFromSeconds(currentTime));
      }
    };
    if (hlsPlayer) {
      hlsPlayer.on(HMSHLSPlayerEvents.CURRENT_TIME, timeupdateHandler);
    }
    return function cleanup() {
      hlsPlayer?.off(HMSHLSPlayerEvents.CURRENT_TIME, timeupdateHandler);
    };
  }, [hlsPlayer]);

  return hlsPlayer ? (
    <Text
      variant="body1"
      css={{
        minWidth: '$16',
        c: '$on_surface_medium',
        display: 'flex',
        justifyContent: 'center',
        fontWeight: '$regular',
      }}
    >
      -{videoTime}
    </Text>
  ) : null;
};
