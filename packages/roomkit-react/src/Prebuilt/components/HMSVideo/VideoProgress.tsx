import React, { useEffect, useState } from 'react';
import { Box, Flex, Slider } from '../../..';
import { useHMSPlayerContext } from './PlayerContext';
import { getPercentage } from './utils';

export const VideoProgress = () => {
  const { hlsPlayer } = useHMSPlayerContext();
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [bufferProgress, setBufferProgress] = useState(0);
  const videoEl = hlsPlayer?.getVideoElement();

  const onValueChange = (time: number) => {
    hlsPlayer?.seekTo(time);
  };
  useEffect(() => {
    if (!videoEl) {
      return;
    }
    const timeupdateHandler = () => {
      if (!videoEl) {
        return;
      }
      const videoProgress = Math.floor(getPercentage(videoEl.currentTime, videoEl.duration));
      let bufferProgress = 0;
      if (videoEl.buffered.length > 0) {
        bufferProgress = Math.floor(getPercentage(videoEl.buffered?.end(0), videoEl.duration));
      }

      setVideoProgress(isNaN(videoProgress) ? 0 : videoProgress);
      setBufferProgress(isNaN(bufferProgress) ? 0 : bufferProgress);
    };
    videoEl.addEventListener('timeupdate', timeupdateHandler);
    return function cleanup() {
      videoEl?.removeEventListener('timeupdate', timeupdateHandler);
    };
  }, [videoEl]);

  const onProgress = (progress: number[]) => {
    const progress1 = Math.floor(getPercentage(progress[0], 100));
    const videoEl = hlsPlayer?.getVideoElement();
    const currentTime = (progress1 * (videoEl?.duration || 0)) / 100;
    if (onValueChange) {
      onValueChange(currentTime);
    }
  };

  if (!videoEl) {
    return null;
  }
  return (
    <Flex align="center" css={{ cursor: 'pointer', h: '$2', alignSelf: 'stretch' }}>
      <Slider
        id="video-actual-rest"
        css={{
          cursor: 'pointer',
          h: '$2',
          zIndex: 1,
          transition: `all .2s ease .5s`,
        }}
        min={0}
        max={100}
        step={1}
        value={[videoProgress]}
        showTooltip={false}
        onValueChange={onProgress}
        thumbStyles={{ w: '$6', h: '$6' }}
      />
      <Box
        id="video-buffer"
        css={{
          h: '$2',
          width: `${bufferProgress - videoProgress}%`,
          background: '$on_surface_high',
          position: 'absolute',
          left: `${videoProgress}%`,
          opacity: '25%',
        }}
      />
    </Flex>
  );
};
