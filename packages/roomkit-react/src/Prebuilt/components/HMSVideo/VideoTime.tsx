import React, { useCallback, useEffect, useState } from 'react';
import { HMSHLSPlayerEvents } from '@100mslive/hls-player';
import { Text } from '../../../Text';
import { useHMSPlayerContext } from './PlayerContext';
import { getDuration, getDurationFromSeconds } from './utils';

export const VideoTime = () => {
  const { hlsPlayer } = useHMSPlayerContext();

  const [videoTime, setVideoTime] = useState(getDurationFromSeconds(0));

  const updateTime = useCallback(
    (currentTime: number) => {
      const videoEl = hlsPlayer?.getVideoElement();
      if (videoEl) {
        const duration = getDuration(videoEl);
        setVideoTime(getDurationFromSeconds(duration - currentTime));
      } else {
        setVideoTime(getDurationFromSeconds(currentTime));
      }
    },
    [hlsPlayer],
  );
  useEffect(() => {
    const timeupdateHandler = (currentTime: number) => {
      updateTime(currentTime);
    };
    if (hlsPlayer) {
      hlsPlayer.on(HMSHLSPlayerEvents.CURRENT_TIME, timeupdateHandler);
      const videoEl = hlsPlayer?.getVideoElement();
      updateTime(videoEl.currentTime);
    }
    return function cleanup() {
      hlsPlayer?.off(HMSHLSPlayerEvents.CURRENT_TIME, timeupdateHandler);
    };
  }, [hlsPlayer, updateTime]);

  return hlsPlayer ? (
    <Text
      variant="body1"
      css={{
        minWidth: '16',
        c: 'onSurface.medium',
        display: 'flex',
        justifyContent: 'center',
        fontWeight: 'regular',
      }}
    >
      -{videoTime}
    </Text>
  ) : null;
};
