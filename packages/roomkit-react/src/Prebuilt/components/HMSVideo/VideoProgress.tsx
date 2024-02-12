import React, { useEffect, useRef, useState } from 'react';
import { Box, Flex } from '../../..';
import { getPercentage } from './HMSVIdeoUtils';
import { useHMSPlayerContext } from './PlayerContext';

export const VideoProgress = () => {
  const hlsPlayerContext = useHMSPlayerContext();
  const [videoProgress, setVideoProgress] = useState(0);
  const [bufferProgress, setBufferProgress] = useState(0);
  const progressRootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const onValueChange = (time: number) => {
    hlsPlayerContext?.seekTo(time);
  };
  useEffect(() => {
    if (!hlsPlayerContext) {
      return;
    }
    videoRef.current = hlsPlayerContext.getVideoElement();
    const timeupdateHandler = () => {
      if (!videoRef.current) {
        return;
      }
      const videoProgress = Math.floor(getPercentage(videoRef.current.currentTime, videoRef.current.duration));
      let bufferProgress = 0;
      if (videoRef.current.buffered.length > 0) {
        bufferProgress = Math.floor(getPercentage(videoRef.current.buffered?.end(0), videoRef.current.duration));
      }

      setVideoProgress(isNaN(videoProgress) ? 0 : videoProgress);
      setBufferProgress(isNaN(bufferProgress) ? 0 : bufferProgress);
    };
    if (videoRef.current) {
      videoRef.current.addEventListener('timeupdate', timeupdateHandler);
    }
    return function cleanup() {
      if (videoRef.current) {
        videoRef.current.removeEventListener('timeupdate', timeupdateHandler);
      }
    };
  }, [hlsPlayerContext]);

  const onProgressChangeHandler = (e: React.MouseEvent<HTMLElement>) => {
    const userClickedX = e.clientX - (progressRootRef.current?.offsetLeft || 0);
    const progressBarWidth = progressRootRef.current?.offsetWidth || 0;
    const progress = Math.floor(getPercentage(userClickedX, progressBarWidth));
    const videoEl = hlsPlayerContext?.getVideoElement();
    const currentTime = (progress * (videoEl?.duration || 0)) / 100;
    if (onValueChange) {
      onValueChange(currentTime);
    }
  };

  return videoRef.current ? (
    <Flex
      ref={progressRootRef}
      css={{ cursor: 'pointer', h: '$4', alignSelf: 'stretch' }}
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
  ) : null;
};
