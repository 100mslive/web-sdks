import React, { useEffect } from 'react';
import { selectTrackAudioByID } from '@100mslive/hms-video-store';
import { useHMSVanillaStore } from '../primitives/HmsRoomProvider';

/**
 * This hook can be used to apply css properties on an element based on the current audio level for the passed in track.
 * It doesn't return the audio level as it's optimised for performance. As audio level could be changing frequently we
 * want to minimise the number of components an audio level change causes to re render.
 * An e.g. use of this hook will be to apply box-shadow on parent tile based on audio level.
 * @param trackId is the audio track id for which audio level needs to be used
 * @param getStyle is a function which can take in current audio level and return the style to apply for the ref
 * @param ref is the ref of the element on which you want the css to apply
 */
export function useAudioLevelStyles({
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
        for (const key in styles) {
          ref.current.style[key] = styles[key];
        }
      }, selectTrackAudioByID(trackId)),
    [getStyle, ref, store, trackId],
  );
}
