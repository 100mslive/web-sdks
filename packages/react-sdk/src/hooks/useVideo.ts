import { selectTrackByID, HMSTrackID } from '@100mslive/hms-video-store';
import { useCallback, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useHMSActions, useHMSStore } from './HmsRoomProvider';
import HMSLogger from '../utils/logger';

/**
 * This hooks can be used to implement a video tile component. Given a track id it will return a ref.
 * The returned ref can be used to set on a video element meant to display the video.
 * The hook will take care of attaching and detaching video, and will automatically detach when the video
 * goes out of view to save on bandwidth.
 * @param trackId {HMSTrackID}
 */
export const useVideo = (trackId: HMSTrackID) => {
  const actions = useHMSActions();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const track = useHMSStore(selectTrackByID(trackId));
  const { ref: inViewRef, inView } = useInView({ threshold: 0.5 });

  const setRefs = useCallback(
    node => {
      videoRef.current = node;
      inViewRef(node);
    },
    [inViewRef],
  );

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
          // detach when not in view
          await actions.detachVideo(track.id, videoRef.current);
        }
      }
    })();
  }, [inView, videoRef, track?.id, track?.enabled, track?.deviceID, track?.plugins]);
  useEffect(() => {
    return () => {
      (async () => {
        if (videoRef.current && track) {
          try {
            // detach on unmount
            await actions.detachVideo(track.id, videoRef.current);
          } catch (err) {
            HMSLogger.w('detach video error for track', track.id, err);
          }
        }
      })();
    };
  }, []);

  return setRefs;
};
