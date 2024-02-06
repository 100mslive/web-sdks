import React, { useEffect, useState } from 'react';
import { HMSHLSPlayerEvents } from '@100mslive/hls-player';
import { Text } from '../../..';
import { getDurationFromSeconds } from './HMSVIdeoUtils';
import { useHMSPlayerContext } from './PlayerContext';

export const VideoTime = () => {
  const hlsPlayerContext = useHMSPlayerContext();
  const [videoTime, setVideoTime] = useState('');

  useEffect(() => {
    const timeupdateHandler = (currentTime: number) => setVideoTime(getDurationFromSeconds(currentTime));
    if (hlsPlayerContext) {
      hlsPlayerContext.on(HMSHLSPlayerEvents.CURRENT_TIME, timeupdateHandler);
    }
    return function cleanup() {
      if (hlsPlayerContext) {
        hlsPlayerContext.off(HMSHLSPlayerEvents.CURRENT_TIME, timeupdateHandler);
      }
    };
  }, [hlsPlayerContext]);

  return hlsPlayerContext ? (
    <Text
      css={{
        minWidth: '$16',
        c: '$on_surface_medium',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {videoTime}
    </Text>
  ) : null;
};
