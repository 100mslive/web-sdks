import React, { useEffect, useState } from 'react';
import { HMSHLSPlayerEvents } from '@100mslive/hls-player';
import { getDurationFromSeconds } from './HMSVIdeoUtils';
import { Text } from '../../';

export const VideoTime = ({ hlsPlayer }) => {
  const [videoTime, setVideoTime] = useState('');

  useEffect(() => {
    const timeupdateHandler = currentTime =>
      setVideoTime(getDurationFromSeconds(currentTime));
    if (hlsPlayer) {
      hlsPlayer.on(HMSHLSPlayerEvents.CURRENT_TIME, timeupdateHandler);
    }
    return function cleanup() {
      if (hlsPlayer) {
        hlsPlayer.off(HMSHLSPlayerEvents.CURRENT_TIME, timeupdateHandler);
      }
    };
  }, [hlsPlayer]);

  return hlsPlayer ? (
    <Text
      css={{
        minWidth: '$16',
      }}
      variant={{
        '@sm': 'xs',
      }}
    >{`${videoTime}`}</Text>
  ) : null;
};
