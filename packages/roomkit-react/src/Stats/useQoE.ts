import { useRef } from 'react';
import { usePrevious } from 'react-use';
import { HMSTrackID, selectHMSStats, useHMSStatsStore } from '@100mslive/react-sdk';

interface UseQoEProps {
  videoTrackID?: HMSTrackID;
  audioTrackID?: HMSTrackID;
  isLocal?: boolean;
}

const EXPECTED_RESOLUTION = 1280 * 720;

const clip = (value: number, min_value: number, max_value: number) => {
  return Math.max(Math.min(value, max_value), min_value);
};

export const useQoE = ({ videoTrackID, audioTrackID, isLocal = false }: UseQoEProps) => {
  const audioTrackStats = useHMSStatsStore(selectHMSStats.trackStatsByID(audioTrackID));
  const videoTrackStats = useHMSStatsStore(selectHMSStats.trackStatsByID(videoTrackID));
  const prevVideoTrackStats = usePrevious(videoTrackStats);
  const prevAudioTrackStats = usePrevious(audioTrackStats);

  const prevJitterBufferDelayMs = useRef<number>(0);

  if (isLocal || !videoTrackStats || !audioTrackStats) {
    return;
  }

  const resolutionNorm = ((videoTrackStats.frameWidth || 0) * (videoTrackStats.frameHeight || 0)) / EXPECTED_RESOLUTION;

  const framesDecodedInLastSec =
    videoTrackStats?.framesDecoded && prevVideoTrackStats?.framesDecoded
      ? videoTrackStats.framesDecoded - prevVideoTrackStats.framesDecoded
      : 0;
  let freezeDurationNorm =
    1 - ((videoTrackStats.totalFreezesDuration || 0) - (prevVideoTrackStats?.totalFreezesDuration || 0));
  freezeDurationNorm = freezeDurationNorm < 0 ? 0.5 : freezeDurationNorm;
  freezeDurationNorm = framesDecodedInLastSec === 0 ? 0 : freezeDurationNorm;

  const fpsNorm = framesDecodedInLastSec / 30;

  const prevJBDelay = prevVideoTrackStats?.jitterBufferDelay || 0;
  const prevJBEmittedCount = prevVideoTrackStats?.jitterBufferEmittedCount || 0;
  const currentJBDelay = (videoTrackStats.jitterBufferDelay || 0) - prevJBDelay;
  const currentJBEmittedCount = (videoTrackStats.jitterBufferEmittedCount || 0) - prevJBEmittedCount;

  const jitterBufferDelayMs =
    currentJBEmittedCount > 0 ? (currentJBDelay * 1000) / currentJBEmittedCount : prevJitterBufferDelayMs.current;
  prevJitterBufferDelayMs.current = jitterBufferDelayMs;
  const delayNorm = 1 - Math.min(1, jitterBufferDelayMs / 2000);

  const prevConcealedSamples =
    (prevAudioTrackStats?.concealedSamples || 0) - (prevAudioTrackStats?.silentConcealedSamples || 0);
  const currentConcealedSamples =
    (audioTrackStats.concealedSamples || 0) - (audioTrackStats.silentConcealedSamples || 0) - prevConcealedSamples;

  const audioConcealedNorm = 1 - currentConcealedSamples / 48000;

  return (
    5 *
    clip(freezeDurationNorm, 0, 1) ** 3 *
    clip(resolutionNorm, 0, 1) ** 0.3 *
    clip(fpsNorm, 0, 1) ** 0.2 *
    clip(delayNorm, 0, 1) ** 0.5 *
    clip(audioConcealedNorm, 0, 1) ** 2
  ).toFixed(2);
};
