import React, { useCallback, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useResizeDetector } from 'react-resize-detector';
import {  HMSTrackID, selectVideoTrackByID } from '@100mslive/hms-video-store';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import { getClosestLayer } from '../utils/layout';
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
  /**
   * Number between 0 and 1 indication when the element is considered inView
   */
  threshold?: number;
  /**
   * Boolean indicating whether the element is visible or not
   */
  visible?: boolean;
  /**
   * Boolean indicating whether the preferredLayer should be auto selected based on video width/height
   * if enabled, this will select the closestLayer available when simulcast is enabled
   */
  autoSelectPreferredLayer?: boolean;
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
export const useVideo = ({
  trackId,
  attach,
  threshold = 0.5,
  visible = true,
  autoSelectPreferredLayer = true,
}: useVideoInput): useVideoOutput => {
  const actions = useHMSActions();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const track = useHMSStore(selectVideoTrackByID(trackId));

  const { ref: inViewRef, inView } = useInView({ threshold, trackVisibility: true, delay: 300 });
  const { width = 0, height = 0, ref: resizeRef } = useResizeDetector({ refreshMode: 'debounce', refreshRate: 300 });

  // eslint-disable-next-line complexity
  const setLayerByResolution = useCallback(async () => {
    if (
      width > 0 &&
      height > 0 &&
      inView &&
      track?.layerDefinitions &&
      resizeRef.current &&
      autoSelectPreferredLayer &&
      track?.enabled &&
      !track?.degraded
    ) {
<<<<<<< HEAD
      let diff = Number.MAX_VALUE;
      let closestLayer: HMSPreferredSimulcastLayer | undefined = undefined;
      for (const { resolution, layer } of track.layerDefinitions) {
        const currDiff = Math.abs(width - resolution.width) + Math.abs(height - resolution.height);
        if (currDiff < diff) {
          diff = currDiff;
          closestLayer = layer;
        }
      }
=======
      const closestLayer = getClosestLayer({ layerDefinitions: track.layerDefinitions!, width, height });
>>>>>>> feat/WEB-751-simulcast
      await actions.setPreferredLayer(track?.id, closestLayer!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, track?.id, actions, autoSelectPreferredLayer, track?.enabled, track?.degraded, resizeRef, inView]);

  const setRefs = useCallback(
    (node: HTMLVideoElement) => {
      if (node) {
        videoRef.current = node;
        inViewRef(node);
        if (track?.layerDefinitions?.length) {
          resizeRef.current = node;
        }
      }
    },
    [inViewRef, track?.layerDefinitions?.length, resizeRef],
  );

  useEffect(() => {
    setLayerByResolution();
  }, [setLayerByResolution]);

  useEffect(() => {
    // eslint-disable-next-line complexity
    (async () => {
      if (videoRef.current && track?.id) {
        if (inView && track.enabled && visible && attach !== false) {
          // attach when in view and enabled
          await actions.attachVideo(track.id, videoRef.current);
        } else {
          // detach when not in view
          await actions.detachVideo(track.id, videoRef.current);
        }
      }
    })();
  }, [actions, inView, videoRef, track?.id, track?.enabled, track?.deviceID, track?.plugins, attach, visible]);

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
