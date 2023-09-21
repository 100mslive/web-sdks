import React, { useEffect, useRef, useState } from 'react';
import { Box, Flex } from '../../../';
import { getPercentage } from './HMSVIdeoUtils';

export const VideoProgress = ({ onValueChange, hlsPlayer }) => {
  const [videoProgress, setVideoProgress] = useState(0);
  const [bufferProgress, setBufferProgress] = useState(0);
  const progressRootRef = useRef();

  useEffect(() => {
    const videoEl = hlsPlayer.getVideoElement();
    const timeupdateHandler = () => {
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
      if (videoEl) {
        videoEl.removeEventListener('timeupdate', timeupdateHandler);
      }
    };
  }, [hlsPlayer]);

  const onProgressChangeHandler = e => {
    const userClickedX = e.clientX - progressRootRef.current.offsetLeft;
    const progressBarWidth = progressRootRef.current.offsetWidth;
    const progress = Math.floor(getPercentage(userClickedX, progressBarWidth));
    const videoEl = hlsPlayer.getVideoElement();
    const currentTime = (progress * videoEl.duration) / 100;

    if (onValueChange) {
      onValueChange(currentTime);
    }
  };

  return hlsPlayer.getVideoElement() ? (
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
