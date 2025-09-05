import React, { useCallback, useEffect, useState } from 'react';
import { Box, Flex, Slider } from '../../..';
import { useHMSPlayerContext } from './PlayerContext';
import { getDuration, getPercentage } from './utils';

export const VideoProgress = ({
  seekProgress,
  setSeekProgress,
}: {
  seekProgress: boolean;
  setSeekProgress: (value: boolean) => void;
}) => {
  const { hlsPlayer } = useHMSPlayerContext();
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [, setBufferProgress] = useState(0);
  const videoEl = hlsPlayer?.getVideoElement();

  const setProgress = useCallback(() => {
    if (!videoEl) {
      return;
    }
    const duration = getDuration(videoEl);
    const videoProgress = Math.floor(getPercentage(videoEl.currentTime, duration));
    let bufferProgress = 0;
    if (videoEl.buffered.length > 0) {
      bufferProgress = Math.floor(getPercentage(videoEl.buffered?.end(0), duration));
    }
    if (!isNaN(videoProgress)) {
      setVideoProgress(videoProgress);
    }
    if (!isNaN(bufferProgress)) {
      setBufferProgress(bufferProgress);
    }
  }, [videoEl]);
  const timeupdateHandler = useCallback(() => {
    if (!videoEl || seekProgress) {
      return;
    }
    setProgress();
  }, [seekProgress, setProgress, videoEl]);
  useEffect(() => {
    if (!videoEl) {
      return;
    }
    setProgress();
    videoEl.addEventListener('timeupdate', timeupdateHandler);
    return function cleanup() {
      videoEl?.removeEventListener('timeupdate', timeupdateHandler);
    };
  }, [setProgress, timeupdateHandler, videoEl]);

  const onProgress = (progress: number[]) => {
    const progress1 = Math.floor(getPercentage(progress[0], 100));
    const videoEl = hlsPlayer?.getVideoElement();
    if (!videoEl) {
      return;
    }
    const duration = isFinite(videoEl.duration) ? videoEl.duration : videoEl.seekable?.end(0) || 0;
    const currentTime = (progress1 * duration) / 100;
    hlsPlayer?.seekTo(currentTime);
    setProgress();
  };

  if (!videoEl) {
    return null;
  }
  return (
    <Flex align="center" css={{ cursor: 'pointer', h: '2', alignSelf: 'stretch' }}>
      <Slider
        id="video-actual-rest"
        css={{
          cursor: 'pointer',
          h: '2',
          zIndex: 1,
          transition: `all .2s ease .5s`,
        }}
        min={0}
        max={100}
        step={1}
        value={[videoProgress]}
        showTooltip={false}
        onValueChange={onProgress}
        onPointerDown={() => setSeekProgress(true)}
        onPointerUp={() => setSeekProgress(false)}
        thumbStyles={{ w: '6', h: '6' }}
      />
      <Box
        id="video-buffer"
        css={{
          h: '2',
          width: `{bufferProgress - videoProgress}%`,
          background: '$on_surface_high',
          position: 'absolute',
          left: `{videoProgress}%`,
          opacity: '25%',
        }}
      />
    </Flex>
  );
};
