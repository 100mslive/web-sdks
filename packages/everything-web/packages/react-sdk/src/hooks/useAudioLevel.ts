import { useEffect } from 'react';
import { selectTrackAudioByID } from '@100mslive/hms-video-store';
import { useHMSVanillaStore } from './HmsRoomProvider';

export function useAudioLevel({
  trackId,
  getStyle,
  ref,
}: {
  trackId?: string;
  getStyle: (level: number) => Record<string, string>;
  ref: React.RefObject<any>;
}) {
  const store = useHMSVanillaStore();
  useEffect(
    () =>
      store.subscribe(level => {
        if (!ref.current) {
          return;
        }
        const styles = getStyle(level);
        console.log(styles , level)
        for (const key in styles) {
          ref.current.style[key] = styles[key];
        }
      }, selectTrackAudioByID(trackId)),
    [trackId],
  );
}