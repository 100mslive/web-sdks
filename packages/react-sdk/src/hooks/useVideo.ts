import { selectTrackByID, HMSTrackID } from '@100mslive/hms-video-store';
import React, { useCallback, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import HMSLogger from '../utils/logger';

export interface useVideoInput {
  /**
   * TrackId that is to be rendered
   */
  trackId?: HMSTrackID;
  /**
   * Boolean stating whether to override the internal behaviour.
   * when attach is false, even if tile is inView or enabled, it won't be rendered
   */
  attach?: boolean;
}

export interface useVideoOutput {
  videoRef: React.RefCallback<HTMLVideoElement>;
}
/**
 * This hooks can be used to implement a video tile component. Given a track id it will return a ref.
 * The returned ref can be used to set on a video element meant to display the video.
 * The hook will take care of attaching and detaching video, and will automatically detach when the video
 * goes out of view to save on bandwidth.
 */
export const useVideo = ({ trackId, attach }: useVideoInput): useVideoOutput => {
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
      if (videoRef.current && track?.id) {
        if (inView && track.enabled && attach !== false) {
          // attach when in view and enabled
          await actions.attachVideo(track.id, videoRef.current);
        } else {
          // detach when not in view
          await actions.detachVideo(track.id, videoRef.current);
        }
      }
    })();
  }, [actions, inView, videoRef, track?.id, track?.enabled, track?.deviceID, track?.plugins, attach]);

  // detach on unmount
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { videoRef: setRefs };
};
