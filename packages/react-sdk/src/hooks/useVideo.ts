import React, { useCallback, useEffect, useRef } from 'react';
import { HMSTrackID, selectVideoTrackByID } from '@100mslive/hms-video-store';
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
  const track = useHMSStore(selectVideoTrackByID(trackId));
  const prevTrackId = useRef<HMSTrackID | undefined>();

  const setRefs = useCallback((node: HTMLVideoElement) => {
    if (node) {
      videoRef.current = node;
    }
  }, []);

  useEffect(() => {
    if (!prevTrackId.current) {
      prevTrackId.current = track?.id;
    } else if (track?.id && prevTrackId.current !== track?.id) {
      // Remove video element reference from previous track by detaching
      (async () => {
        if (videoRef.current) {
          try {
            HMSLogger.d('detaching because different track is passed');
            await actions.detachVideo(prevTrackId.current!, videoRef.current);
          } catch (err) {
            HMSLogger.w('detach video error for track', prevTrackId.current, err);
          }
        }
        prevTrackId.current = track?.id;
      })();
    }
  }, [track?.id, actions]);

  useEffect(() => {
    (async () => {
      if (track?.id && videoRef.current) {
        if (attach !== false) {
          await actions.attachVideo(track.id, videoRef.current);
        } else {
          await actions.detachVideo(track.id, videoRef.current);
        }
      }
    })();
  }, [track, attach, actions]);

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
