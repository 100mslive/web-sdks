import { useCallback, useRef } from 'react';
import { useTheme } from '../Theme';
import { useAudioLevelStyles } from '@100mslive/react-sdk';
import { HMSTrackID } from '@100mslive/hms-video-store';

/**
 * pass in a track id and get a ref. That ref can be attached to an element which will have border
 * as per audio level post that.
 */
export function useBorderAudioLevel(audioTrackId?: HMSTrackID) {
  const { theme } = useTheme();
  const color = theme.colors.brandDefault.value;
  const getStyle = useCallback(
    (level: number) => {
      const style: Record<string, string> = {
        transition: 'box-shadow 0.4s ease-in-out',
      };
      style['box-shadow'] = level
        ? `0px 0px ${24 * sigmoid(level)}px ${color}, 0px 0px ${16 * sigmoid(level)}px ${color}`
        : '';
      return style;
    },
    [color],
  );
  const ref = useRef(null);
  useAudioLevelStyles({
    trackId: audioTrackId,
    getStyle,
    ref,
  });
  return ref;
}

export const sigmoid = (z: number) => {
  return 1 / (1 + Math.exp(-z));
};
