import { selectTrackByID, HMSTrackID } from '@100mslive/hms-video-store';
import { useCallback, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useHMSActions, useHMSStore } from './HmsRoomProvider';

/**
 *
 * @param trackId {HMSTrackID}
 * @returns
 */
export const useVideo = (trackId: HMSTrackID) => {
  const actions = useHMSActions();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { ref: inViewRef, inView } = useInView({ threshold: 0.5 });
  const setRefs = useCallback(
    node => {
      videoRef.current = node;
      inViewRef(node);
    },
    [inViewRef],
  );
  const track = useHMSStore(selectTrackByID(trackId));
  useEffect(() => {
    (async () => {
      if (videoRef.current && track) {
        if (inView) {
          if (track.enabled) {
            // attach when in view and enabled
            await actions.attachVideo(track.id, videoRef.current);
          } else {
            // detach when in view but not enabled
            await actions.detachVideo(track.id, videoRef.current);
          }
        } else {
          await actions.detachVideo(track.id, videoRef.current);
        }
      }
    })();
  }, [inView, videoRef, track?.id, track?.enabled, track?.deviceID, track?.plugins]);
  useEffect(() => {
    return () => {
      if (videoRef.current && track) {
        actions.detachVideo(track.id, videoRef.current);
      }
    };
  }, []);

  return setRefs;
};
