import { useCallback, useRef } from 'react';
import { HMSTrackID } from '@100mslive/hms-video-store';
import { useAudioLevelStyles } from '@100mslive/react-sdk';
import { useTheme } from '../Theme';

/**
 * pass in a track id and get a ref. That ref can be attached to an element which will have border
 * as per audio level post that.
 */
export function useBorderAudioLevel(audioTrackId?: HMSTrackID) {
  const { theme } = useTheme();
  const color = theme.colors.primary_default.value;
  const getStyle = useCallback(
    (level: number) => {
      const style: Record<string, string> = {
        transition: 'outline 0.4s ease-in-out',
      };
      style['outline'] = level ? `${sigmoid(level) * 4}px solid ${color}` : '0px solid transparent';
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
