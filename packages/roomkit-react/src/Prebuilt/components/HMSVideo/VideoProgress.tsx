import React, { useEffect, useRef, useState } from 'react';
import { Box, Flex } from '../../..';
import { useHMSPlayerContext } from './PlayerContext';
import { getPercentage } from './utils';

export const VideoProgress = () => {
  const { hlsPlayer } = useHMSPlayerContext();
  const [videoProgress, setVideoProgress] = useState(0);
  const [bufferProgress, setBufferProgress] = useState(0);
  const progressRootRef = useRef<HTMLDivElement>(null);
  const videoEl = hlsPlayer?.getVideoElement();

  const onValueChange = (time: number) => {
    hlsPlayer?.seekTo(time);
  };
  useEffect(() => {
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
    if (videoEl) {
      videoEl.addEventListener('timeupdate', timeupdateHandler);
    }
    return function cleanup() {
      videoEl?.removeEventListener('timeupdate', timeupdateHandler);
    };
  }, [videoEl]);

  const onProgressChangeHandler = (e: React.MouseEvent<HTMLElement>) => {
    const userClickedX = e.clientX - (progressRootRef.current?.offsetLeft || 0);
    const progressBarWidth = progressRootRef.current?.offsetWidth || 0;
    const progress = Math.floor(getPercentage(userClickedX, progressBarWidth));
    const videoEl = hlsPlayer?.getVideoElement();
    const currentTime = (progress * (videoEl?.duration || 0)) / 100;
    if (onValueChange) {
      onValueChange(currentTime);
    }
  };

  if (!videoEl) {
    return null;
  }
  return (
    <Flex
      ref={progressRootRef}
      css={{ cursor: 'pointer', h: '$2', alignSelf: 'stretch' }}
      onClick={onProgressChangeHandler}
    >
      <Box
        id="video-actual"
        css={{
          display: 'inline',
          width: `${videoProgress}%`,
          background: '$primary_default',
        }}
      />
      <Box
        id="video-buffer"
        css={{
          width: `${bufferProgress - videoProgress}%`,
          background: '$on_surface_high',
          opacity: '25%',
        }}
      />
      <Box
        id="video-rest"
        css={{
          width: `${100 - bufferProgress}%`,
          background: '$on_surface_high',
          opacity: '10%',
        }}
      />
    </Flex>
  );
};
